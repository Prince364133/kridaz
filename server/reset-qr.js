import { prisma } from './config/prisma.js';

async function run() {
  await prisma.team.updateMany({
    data: { qrCode: null }
  });
  console.log("Reset all team qrCodes to null");
  process.exit(0);
}

run();
