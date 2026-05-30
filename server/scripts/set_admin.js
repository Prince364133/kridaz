import crypto from 'crypto';
import { prisma } from "../config/prisma.js";
import argon2 from "argon2";
import dotenv from "dotenv";

dotenv.config();

const updateAdmin = async () => {
  try {
    const email = "admin@kridaz.com";
    const password = "364133";
    const hashedPassword = await argon2.hash(password);

    console.log(`Setting password for ${email}...`);

    const existingUser = await prisma.user.findFirst({
      where: { email: email }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword, role: "ADMIN" }
      });
      console.log("Updated existing admin user.");
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: "Super Admin",
          username: "super_admin",
          email: email,
          password: hashedPassword,
          phone: "0000000000",
          role: "ADMIN",
        }
      });
      await prisma.ownerProfile.create({
        data: {
          userId: newUser.id,
          businessName: "Kridaz Admin",
          verified: true
        }
      });
      console.log("Created new admin user.");
    }

    await prisma.$disconnect();
    console.log("Done.");
  } catch (error) {
    console.error("Error:", error);
    await prisma.$disconnect();
  }
};

updateAdmin();
