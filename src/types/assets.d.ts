// esbuild inlines these as data: URLs (`loader: { '.woff2': 'dataurl' }` in
// scripts/build.js), so importing one yields a string.
declare module '*.woff2' {
  const url: string;
  export default url;
}
