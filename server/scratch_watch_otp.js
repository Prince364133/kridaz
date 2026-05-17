import { prisma } from './config/prisma.js';

console.log("OTP Watcher started... Watching for generated OTPs in the database.");

let seenIds = new Set();

// Perform initial pull to mark existing OTPs as seen
try {
  const existing = await prisma.oTP.findMany({ select: { id: true } });
  existing.forEach(o => seenIds.add(o.id));
} catch (err) {
  console.error("Error reading initial OTPs:", err.message);
}

setInterval(async () => {
  try {
    const otps = await prisma.oTP.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    for (const otp of otps) {
      if (!seenIds.has(otp.id)) {
        seenIds.add(otp.id);
        console.log(`\n========================================`);
        console.log(`[NEW OTP DETECTED]`);
        console.log(`Email: ${otp.email}`);
        console.log(`Phone: ${otp.phone}`);
        console.log(`Email OTP: ${otp.emailOtp}`);
        console.log(`Phone OTP: ${otp.phoneOtp}`);
        console.log(`Expires At: ${otp.expiresAt}`);
        console.log(`========================================\n`);
      }
    }
  } catch (err) {
    console.error("Polling error:", err.message);
  }
}, 1000);
