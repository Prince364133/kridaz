import { prisma } from "./config/prisma.js";

async function findUsers() {
  console.log("Fetching all users in the database...");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log("Users list:", JSON.stringify(users, null, 2));
}

findUsers().catch(console.error).finally(() => process.exit(0));
