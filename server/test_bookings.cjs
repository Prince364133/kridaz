const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany();
  console.log('Total bookings in DB:', bookings.length);
  
  const hosted = await prisma.hostedGame.findMany();
  console.log('Total hosted games in DB:', hosted.length);
}

main().finally(() => prisma.$disconnect());
