const fs = require('fs');
const path = require('path');

// The package is "type": "module", so the CommonJS output needs its own scope
// marker or Node reads those .js files as ESM and every require() fails.
const cjsDir = path.join(__dirname, '..', 'dist', 'cjs');

if (fs.existsSync(cjsDir)) {
  fs.writeFileSync(
    path.join(cjsDir, 'package.json'),
    `${ JSON.stringify({ type: 'commonjs' }, null, 2) }\n`
  );
}
