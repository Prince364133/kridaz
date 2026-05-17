import { prisma } from './config/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    }
  });
  console.log("Users in DB:", JSON.stringify(users, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // pg pool disconnect is not strictly needed for quick script
  });
