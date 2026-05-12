const fs = require('fs');
const path = require('path');

const routerPath = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/router.jsx';
const content = fs.readFileSync(routerPath, 'utf8');

const importRegex = /import\s+(?:\{[^}]+\}|[^{}\n,]+)\s+from\s+['"]([^'"]+)['"]/g;
let match;
const baseDir = path.dirname(routerPath);

const aliases = {
  '@user': 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/user',
  '@components': 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/components',
};

console.log("Checking imports in router.jsx...");

while ((match = importRegex.exec(content)) !== null) {
  let importPath = match[1];
  let resolvedPath = '';

  if (importPath.startsWith('.')) {
    resolvedPath = path.resolve(baseDir, importPath);
  } else {
    let foundAlias = false;
    for (const [alias, aliasPath] of Object.entries(aliases)) {
      if (importPath.startsWith(alias)) {
        resolvedPath = importPath.replace(alias, aliasPath);
        foundAlias = true;
        break;
      }
    }
    if (!foundAlias) continue; // Skip non-alias/relative imports like 'react'
  }

  // Handle missing extensions
  const extensions = ['.jsx', '.js', '/index.jsx', '/index.js'];
  let exists = fs.existsSync(resolvedPath);
  if (!exists) {
    for (const ext of extensions) {
      if (fs.existsSync(resolvedPath + ext)) {
        exists = true;
        break;
      }
    }
  }

  if (!exists) {
    console.error(`MISSING: ${importPath} -> ${resolvedPath}`);
  } else {
    // console.log(`OK: ${importPath}`);
  }
}
console.log("Done.");
