import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const turfs = await prisma.turf.findMany();
  console.log("Turfs in DB:", turfs.map(t => t.name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
