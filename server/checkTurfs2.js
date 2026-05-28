import { prisma } from './config/prisma.js';

async function check() {
  const turfs = await prisma.turf.findMany();
  console.log("Turfs count:", turfs.length);
  console.log("Turfs:", turfs.map(t => ({ id: t.id, name: t.name, status: t.status })));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
