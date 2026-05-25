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

  // We find className="something" or className={`something`} to do button/card specific heuristics
  const classRegex = /className=(?:["']([^"']*)["']|{`([^`]*)\`})/g;

  content = content.replace(classRegex, (match, p1, p2) => {
    let classes = p1 !== undefined ? p1 : p2;
    if (!classes) return match;

    // Handle large bracketed rounded values
    classes = classes.replace(/(?:md:|lg:|sm:)?rounded-\[.*?\]/g, (m) => {
      // Don't replace rounded-[6px] or rounded-[8px] or rounded-full
      if (m.includes('rounded-[6px]') || m.includes('rounded-[8px]') || m.includes('rounded-[50%]') || m.match(/rounded-\[\d+px\]/)) {
        // If it's larger than 12px, make it 8px
        const pxMatch = m.match(/rounded-\[(\d+)px\]/);
        if (pxMatch && parseInt(pxMatch[1]) > 12) {
          return m.replace(/\[\d+px\]/, '[8px]');
        }
        return m;
      }
      if (m.includes('rem') || m.includes('em') || m.includes('%')) {
        // usually large rounded, replace with [8px]
        return m.replace(/\[.*?\]/, '[8px]');
      }
      return m;
    });

    // Handle large standard rounded values
    classes = classes.replace(/(?:md:|lg:|sm:)?rounded-(?:xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/g, (m) => {
      return m.replace(/-(?:xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/, '-[8px]');
    });

    let isButton = false;
    let isCard = false;

    // Heuristics for buttons
    if (
      classes.includes('btn ') || classes.endsWith('btn') ||
      (classes.includes('px-') && classes.includes('py-') && (classes.includes('inline-flex') || classes.includes('flex') || classes.includes('block')) && (classes.includes('text-center') || classes.includes('items-center')) && classes.match(/bg-|border|hover:/)) ||
      classes.includes('hover:bg-') && classes.match(/px-\d/) && classes.match(/py-\d/)
    ) {
      isButton = true;
    }

    // Heuristics for cards
    if (
      classes.includes('card') || 
      (classes.includes('p-') && classes.includes('bg-') && classes.includes('border')) ||
      classes.includes('backdrop-blur')
    ) {
      if (!isButton) {
        isCard = true;
      }
    }

    // Small circular elements like avatars or icons
    let isSmallCircle = classes.match(/w-[1-9]\b|w-1[0-6]\b/) && classes.match(/h-[1-9]\b|h-1[0-6]\b/);
    if (!isSmallCircle && classes.match(/rounded-full/) && classes.match(/w-\d+/) && classes.match(/h-\d+/)) {
       // if it explicitly has width and height and rounded-full, it's likely a circle.
       isSmallCircle = true;
    }

    if (isButton) {
       if (!isSmallCircle) {
         classes = classes.replace(/(?:md:|sm:|lg:)?rounded-(?:none|sm|md|lg|full|box|btn)/g, (m) => {
            return m.replace(/-(?:none|sm|md|lg|full|box|btn)/, '-[6px]');
         });
       }
    } else if (isCard) {
       if (!isSmallCircle) {
         classes = classes.replace(/(?:md:|sm:|lg:)?rounded-(?:none|sm|md|lg|full|box|btn)/g, (m) => {
            return m.replace(/-(?:none|sm|md|lg|full|box|btn)/, '-[8px]');
         });
       }
    }

    // Cleanup multiple spaces
    classes = classes.replace(/\s+/g, ' ').trim();

    if (p1 !== undefined) {
      return `className="${classes}"`;
    } else {
      return `className={\`${classes}\`}`;
    }
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Modified ${modifiedCount} files.`);
