const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sassPlugin, postcssModules } = require('esbuild-sass-plugin');
const { sentryEsbuildPlugin } = require("@sentry/esbuild-plugin");

const shared = {
  bundle: true,
  minify: true,
  outdir: 'build',
  entryNames: '[dir]/[name]',
  loader: { '.svg': 'text' },
  sourcemap: true
};

const contentEntryPoints = Object.fromEntries(
  fs.readdirSync('src/content')
    .filter(file => file.endsWith('.ts'))
    .map(file => [`content/${file.replace('.ts', '')}`, `src/content/${file}`])
);

const hashContentScripts = () => {
  const dir = 'build/content';
  const files = Object.keys(contentEntryPoints).map(entry => `${path.basename(entry)}.js`);
  const renames = new Map();

  // drop hashed leftovers from a previous build that skipped `npm run clean`
  fs.readdirSync(dir)
    .filter(file => !files.includes(file.replace(/\.map$/, '')))
    .forEach(file => fs.unlinkSync(path.join(dir, file)));

  const hashFile = (file) => {
    let source = fs.readFileSync(path.join(dir, file), 'utf8');

    renames.forEach((to, from) => {
      source = source.split(`content/${from}`).join(`content/${to}`);
    });

    const hash = crypto.createHash('md5').update(source).digest('hex').slice(0, 8);
    const renamed = file.replace(/\.js$/, `.${hash}.js`);

    fs.writeFileSync(
      path.join(dir, renamed),
      source.replace(`sourceMappingURL=${file}.map`, `sourceMappingURL=${renamed}.map`)
    );
    fs.renameSync(path.join(dir, `${file}.map`), path.join(dir, `${renamed}.map`));
    fs.unlinkSync(path.join(dir, file));
    renames.set(file, renamed);
  };

  // background.js last: its bundle embeds the other scripts' paths, which must already be hashed
  files.filter(file => file !== 'background.js').forEach(hashFile);
  hashFile('background.js');

  const manifestPath = 'build/manifest.json';
  const manifest = [...renames].reduce(
    (content, [from, to]) => content.split(`content/${from}`).join(`content/${to}`),
    fs.readFileSync(manifestPath, 'utf8')
  );

  fs.writeFileSync(manifestPath, manifest);
};

(async () => {
  await require('esbuild').build({
    ...shared,
    entryPoints: { 'application': 'src/index.tsx' },
    plugins: [
      await require('esbuild-plugin-copy').copy({
        resolveFrom: 'cwd',
        assets: {
          from: ['./static/**/*'],
          to: ['./build'],
          keepStructure: true
        }
      }),
      sassPlugin({
        type: 'style',
        transform: postcssModules({})
      }),
      sentryEsbuildPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "json-rpc-chrome-viewer",
        project: "json-rpc-chrome-viewer",
      })
    ]
  }).catch(() => process.exit(1));

  await require('esbuild').build({
    ...shared,
    entryPoints: contentEntryPoints,
    plugins: []
  }).catch(() => process.exit(1));

  hashContentScripts();
})();
