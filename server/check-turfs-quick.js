import { prisma } from './config/prisma.js';

async function main() {
  console.log("Checking Turfs in database using config/prisma.js...");
  const turfs = await prisma.turf.findMany({
    include: {
      owner: {
        include: {
          user: true
        }
      }
    }
  });
  console.log(`Found ${turfs.length} turfs.`);
  for (const t of turfs) {
    console.log(`- ID: ${t.id}`);
    console.log(`  Name: ${t.name}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  IsActive: ${t.isActive}`);
    console.log(`  Owner Business: ${t.owner?.businessName}`);
    console.log(`  Owner User: ${t.owner?.user?.name} (${t.owner?.user?.email})`);
    console.log(`  CreatedAt: ${t.createdAt}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
