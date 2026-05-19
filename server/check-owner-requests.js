import { prisma } from './config/prisma.js';

async function main() {
  console.log("Checking OwnerRequests in database...");
  const requests = await prisma.ownerRequest.findMany({
    include: {
      user: true
    }
  });
  console.log(`Found ${requests.length} owner requests.`);
  for (const r of requests) {
    console.log(`- ID: ${r.id}`);
    console.log(`  Name: ${r.name}`);
    console.log(`  Email: ${r.email}`);
    console.log(`  Status: ${r.status}`);
    console.log(`  Role: ${r.role}`);
    console.log(`  User: ${r.user?.name} (${r.user?.email})`);
    console.log(`  CreatedAt: ${r.createdAt}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
