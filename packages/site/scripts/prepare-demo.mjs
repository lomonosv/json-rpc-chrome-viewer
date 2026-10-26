// Assembles public/demo/: the extension's real panel bundle plus the chrome
// stub that lets it run on a web page (see demo/stub.js). The panel bundle is
// produced by the extension build (`node scripts/build.js` at the repo root);
// the root `build:site` / `dev:site` scripts run that first.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const panelBundle = join(site, '..', '..', 'build', 'application.js');
const out = join(site, 'public', 'demo');

if (!existsSync(panelBundle)) {
  console.error(`prepare-demo: ${ panelBundle } is missing. Build the extension first `
    + '(`pnpm run build:site` from the repo root does both).');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
copyFileSync(panelBundle, join(out, 'application.js'));
copyFileSync(join(site, 'demo', 'stub.js'), join(out, 'stub.js'));
copyFileSync(join(site, 'demo', 'index.html'), join(out, 'index.html'));

console.log('prepare-demo: public/demo/ ready');
