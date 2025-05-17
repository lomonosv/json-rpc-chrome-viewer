const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const env = dotenv.config().parsed;

if (!env) {
  process.exit(1);
}

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

function replaceEnvVariables(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  Object.keys(env).forEach(key => {
    const regex = new RegExp(`process\\.env\\.${key}\\b`, 'g');
    content = content.replace(regex, JSON.stringify(env[key]));
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`ENV variable substitute: ${ filePath }`);
  }
}

walkDir(BUILD_DIR, replaceEnvVariables);
