const { sassPlugin, postcssModules } = require('esbuild-sass-plugin');

(async () => {
  await require('esbuild').build({
    entryPoints: ['./src/index.jsx'],
    bundle: true,
    minify: true,
    outfile: './build/application.js',
    loader: { '.svg': 'text' },
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
      })
    ]
  }).catch(() => process.exit(1));
})();
