const { sassPlugin, postcssModules } = require('esbuild-sass-plugin');
const { sentryEsbuildPlugin } = require("@sentry/esbuild-plugin");

(async () => {
  await require('esbuild').build({
    entryPoints: {
      'application': 'src/index.tsx',
      ...Object.fromEntries(
        require('fs').readdirSync('src/content')
          .filter(file => file.endsWith('.ts'))
          .map(file => [`content/${file.replace('.ts', '')}`, `src/content/${file}`])
      )
    },
    bundle: true,
    minify: true,
    outdir: 'build',
    entryNames: '[dir]/[name]',
    loader: { '.svg': 'text' },
    sourcemap: true,
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
})();
