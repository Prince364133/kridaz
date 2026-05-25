const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/Kridaz/kridaz/client/user/src');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We want to replace any mangled SUBHEADING_STYLE with the clean one
  // match anything like const SUBHEADING_STYLE = { ... };
  const subheadingRegex = /const\s+SUBHEADING_STYLE\s*=\s*\{.*?\};/g;
  
  content = content.replace(subheadingRegex, "const SUBHEADING_STYLE = { fontFamily: \"'Inter 28pt Black', sans-serif\", fontWeight: 900 };");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Fixed ${modifiedCount} files.`);
