import fs from 'fs';
const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/features/venue-owner/Banking/VenueBanking.jsx';
const buffer = fs.readFileSync(path);
console.log("Buffer length:", buffer.length);
console.log("First bytes:", buffer.slice(0, 10));
// Let's rewrite it as UTF-8 if it starts with FF FE (UTF-16 LE BOM)
if (buffer[0] === 0xff && buffer[1] === 0xfe) {
  console.log("File is UTF-16 LE. Converting to UTF-8...");
  const text = buffer.toString('utf16le');
  fs.writeFileSync(path, text, 'utf8');
  console.log("Converted to UTF-8.");
} else if (buffer.indexOf(0x00) !== -1) {
  console.log("File contains null bytes, likely UTF-16 without BOM. Converting...");
  const text = buffer.toString('utf16le');
  fs.writeFileSync(path, text, 'utf8');
  console.log("Converted to UTF-8.");
} else {
  console.log("File seems to be UTF-8 already.");
}
