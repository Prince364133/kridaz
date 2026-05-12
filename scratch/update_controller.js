
import fs from 'fs';

const filePath = 'c:\\Users\\saavi\\OneDrive\\Desktop\\kridaz\\kridaz\\server\\modules\\hostedGame\\hostedGame.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update destructuring
content = content.replace(
  'quickSlotsData = [],   // [{ role, userId, customPlayer }] from frontend',
  'quickSlotsData = [],   // [{ role, userId, customPlayer }] from frontend\n        customUmpireData,      // { name, email, phone }'
);

// 2. Update HostedGame constructor
content = content.replace(
  'status: "ACTIVE",',
  'status: "ACTIVE",\n        customUmpire: customUmpireData?.email ? {\n          ...customUmpireData,\n          inviteToken: randomUUID(),\n          inviteStatus: "PENDING",\n          invitedAt: new Date()\n        } : undefined'
);

// 3. Update notifications
const inviteBlock = `    // Send invite to custom umpire (non-blocking)
    if (result.customUmpire?.inviteToken) {
      const { sendCustomUmpireInvite } = await import("../../utils/notification.service.js");
      sendCustomUmpireInvite(result.customUmpire, result, host).catch(e =>
        console.error("[CustomUmpireInvite] Error:", e)
      );
    }`;

content = content.replace(
  /if \(result\.customPlayers\?\.length\) \{[\s\S]*?\}\n    \}/,
  (match) => match + '\n\n' + inviteBlock
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully');
