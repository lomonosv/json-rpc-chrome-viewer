(async () => {
  await require('esbuild').build({
    entryPoints: ['./src/index.jsx'],
    bundle: true,
    outfile: './build/application.js',
    // loader: {
    //   ".ts": "ts",
    //   ".tsx": "ts"
    // },
    plugins: [
      await require('esbuild-plugin-copy').copy({
        resolveFrom: 'cwd',
        assets: {
          from: ['./static/**/*'],
          to: ['./build'],
          keepStructure: true
        }
      })
    ]
  }).catch(() => process.exit(1));
})();