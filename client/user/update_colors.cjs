const fs = require('fs');
const path = '/Users/srikalyanbhaskara/kridaz/client/user/src/features/networking/pages/Community.jsx';

let content = fs.readFileSync(path, 'utf8');

// Replace specific bg colors with gradient
content = content.replace(/bg-\[#84CC16\]/g, 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367]');

// Replace hover bg for the post button
content = content.replace(/hover:bg-\[#a3e635\]/g, 'hover:opacity-90');

// Replace active filter button border
content = content.replace(/border-\[#84CC16\] hover:brightness-110/g, 'border-transparent hover:brightness-110');

// Fix the rgba shadow
content = content.replace(/rgba\(132,204,22,0\.15\)/g, 'rgba(85,222,232,0.15)');

// Replace all remaining #84CC16 with #55DEE8
content = content.replace(/#84CC16/g, '#55DEE8');

fs.writeFileSync(path, content, 'utf8');
console.log("Colors updated successfully.");
