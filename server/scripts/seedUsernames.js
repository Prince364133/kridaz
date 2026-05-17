import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const seedUsernames = async () => {
  try {
    logger.info("Seeding usernames with Prisma...");

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { username: "" }
        ]
      }
    });
    logger.info(`Found ${users.length} users without usernames`);

    for (const user of users) {
      let baseUsername = (user.name || "player").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      let username = baseUsername;
      let counter = 1;

      // Ensure uniqueness
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { username }
      });
      logger.info(`Assigned username @${username} to user ${user.name}`);
    }

    logger.info("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedUsernames();
