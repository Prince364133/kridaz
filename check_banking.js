import fs from 'fs';
const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/features/venue-owner/Banking/VenueBanking.jsx';
const text = fs.readFileSync(path, 'utf8');

const hooks = new Set();
const matches = text.match(/use[A-Z][a-zA-Z0-9_]+/g);
if (matches) {
  matches.forEach(m => hooks.add(m));
}
console.log("Hooks used:");
console.log(Array.from(hooks).join('\n'));

const apis = new Set();
const apiMatches = text.match(/\/api\/[a-zA-Z0-9_/-]+/g);
if (apiMatches) {
  apiMatches.forEach(m => apis.add(m));
}
console.log("APIs used:");
console.log(Array.from(apis).join('\n'));
