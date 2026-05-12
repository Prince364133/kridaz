import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function removeItalic(dirPath) {
    walkDir(dirPath, function(filePath) {
        if (!filePath.match(/\.(js|jsx|css)$/)) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        if (filePath.endsWith('.css')) {
            newContent = newContent.replace(/font-style:\s*italic\s*!?i?m?p?o?r?t?a?n?t?;?/g, '');
        } else {
            newContent = newContent.replace(/\bnot-italic\b/g, '');
            newContent = newContent.replace(/\bitalic\b/g, '');
            newContent = newContent.replace(/  +/g, ' ');
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    });
}

const targetDir = path.resolve('client/user/src');
console.log(`Scanning: ${targetDir}`);
removeItalic(targetDir);
console.log('Done.');
