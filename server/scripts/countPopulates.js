import fs from 'fs';
import path from 'path';
import logger from "../utils/logger.js";

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const counts = {};
const root = 'server/modules';

walk(root, (filePath) => {
  if (filePath.endsWith('.js')) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/\.populate\(/g);
    if (matches) {
      counts[filePath] = matches.length;
    }
  }
});

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
logger.info(JSON.stringify(sorted.slice(0, 20), null, 2));
