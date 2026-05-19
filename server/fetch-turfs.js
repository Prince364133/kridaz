import { prisma } from './config/prisma.js';

async function main() {
  console.log("Fetching all OwnerRequests...");
  const requests = await prisma.ownerRequest.findMany({
    include: {
      user: true
    }
  });
  console.log(`Found ${requests.length} OwnerRequests.`);
  for (const r of requests) {
    console.log({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      status: r.status,
      role: r.role,
      userId: r.userId
    });
  }

  console.log("\nFetching all OwnerProfiles...");
  const profiles = await prisma.ownerProfile.findMany({
    include: {
      user: true
    }
  });
  console.log(`Found ${profiles.length} OwnerProfiles.`);
  for (const p of profiles) {
    console.log({
      id: p.id,
      userId: p.userId,
      businessName: p.businessName,
      verified: p.verified,
      userEmail: p.user?.email,
      userRole: p.user?.role
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
