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

  const regex = /const\s+SUBHEADING_STYLE\s*=\s*\{\s*fontFamily:\s*"'Inter 28pt Black', sans-serif",\s*fontWeight:\s*900\s*\};/g;
  content = content.replace(regex, 'const SUBHEADING_STYLE = { fontFamily: "\'Inter 28pt Light\', sans-serif", fontWeight: 300 };');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Updated ${modifiedCount} files to use Inter 28pt Light.`);
