const fs = require('fs');

const p = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/server/modules/chat/chat.controller.js';
let content = fs.readFileSync(p, 'utf8');

const regex = /participants:\s*\{\s*some:\s*\{\s*OR:\s*\[\s*\{\s*userId:\s*currentParticipant\.userId,\s*ownerId:\s*currentParticipant\.ownerId\s*},\s*\{\s*userId:\s*targetParticipant\.userId,\s*ownerId:\s*targetParticipant\.ownerId\s*}\s*\]\s*\}\s*\}/;

const newString = `AND: [
          { participants: { some: { userId: currentParticipant.userId, ownerId: currentParticipant.ownerId } } },
          { participants: { some: { userId: targetParticipant.userId, ownerId: targetParticipant.ownerId } } }
        ]`;

content = content.replace(regex, newString);

fs.writeFileSync(p, content);
console.log('done');
