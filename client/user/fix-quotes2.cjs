const fs = require('fs');
const path = require('path');

const directoryPath = 'd:\\Kridaz\\kridaz\\client\\user\\src';

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(/bg-\[url\("https:\/\/www\.transparenttextures\.com\/patterns\/carbon-fibre\.png'\)\]/g, "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]");
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
      replaceInFile(filePath);
    }
  }
}

walkDir(directoryPath);
console.log('Done 2');
