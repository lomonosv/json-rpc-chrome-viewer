const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Explicit list: .env may also hold SENTRY_AUTH_TOKEN, which must never reach the bundle.
const PUBLIC_KEYS = ['SENTRY_DSN', 'ENVIRONMENT'];

dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const BUILD_DIR = path.join(__dirname, '../build');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

// Unset values become `undefined`: extension pages have no `process`.
// Source maps are skipped: a quoted value would break their JSON.
function replaceEnvVariables(filePath) {
  if (!filePath.endsWith('.js')) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  PUBLIC_KEYS.forEach(key => {
    const value = process.env[key];
    const regex = new RegExp(`process\\.env\\.${key}\\b`, 'g');
    content = content.replace(regex, value ? JSON.stringify(value) : 'undefined');
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

walkDir(BUILD_DIR, replaceEnvVariables);

console.log(`ENV variable substitute: ${ PUBLIC_KEYS.map(key => `${ key }=${ process.env[key] ? 'set' : 'unset' }`).join(', ') }`);
