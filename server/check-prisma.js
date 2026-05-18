import pkg_prisma from '@prisma/client';
import { fileURLToPath } from 'url';
import path from 'path';

console.log("Resolved paths:");
try {
  // Let's resolve the path
  const prismaPath = fileURLToPath(import.meta.resolve('@prisma/client'));
  console.log("@prisma/client path:", prismaPath);
} catch (e) {
  console.log("Could not resolve path natively:", e.message);
}

// Inspect models
const { PrismaClient } = pkg_prisma;
const prisma = new PrismaClient();
console.log("Prisma client keys:", Object.keys(prisma).filter(k => !k.startsWith('$')));
prisma.$disconnect();
