import { prisma } from './config/prisma.js';
import argon2 from 'argon2';

async function main() {
  const adminEmail = "admin@kridaz.com";
  const adminPhone = "+910000000000";
  const adminUsername = "kridazadmin";
  const adminPassword = "AdminPassword123!";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { phone: adminPhone },
        { username: adminUsername }
      ]
    }
  });

  if (existingAdmin) {
    console.log("Admin user already exists. ID:", existingAdmin.id);
    return;
  }

  const hashedPassword = await argon2.hash(adminPassword);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      phone: adminPhone,
      username: adminUsername,
      password: hashedPassword,
      role: "ADMIN",
      isVerified: true,
      isOnboarded: true,
      status: "active"
    }
  });

  console.log("====================================");
  console.log("Admin seeded successfully!");
  console.log("ID:", admin.id);
  console.log("Email:", adminEmail);
  console.log("Username:", adminUsername);
  console.log("Password:", adminPassword);
  console.log("====================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
