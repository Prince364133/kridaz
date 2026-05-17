import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../config/prisma.js";
import logger from "../utils/logger.js";

async function migrateUserDecomposition() {
  logger.info("🚀 Starting User God-Object decomposition migration...");

  const BATCH_SIZE = 50;
  let processedCount = 0;
  let profileCreated = 0;
  let oauthCreated = 0;

  // Fetch all users with their current relations to check if they already exist
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      oauth: true,
    },
  });

  logger.info(`📊 Found ${users.length} users to process.`);

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        try {
          // 1. Migrate Profile Data
          if (!user.profile) {
            await prisma.userProfile.create({
              data: {
                userId: user.id,
                bio: user.bio || null,
                gender: user.gender || null,
                interests: user.interests || [],
                sportTypes: user.sportTypes || [],
                city: user.city || null,
                state: user.state || null,
                latitude: user.latitude || null,
                longitude: user.longitude || null,
              },
            });
            profileCreated++;
          }

          // 2. Migrate OAuth Data
          if (!user.oauth) {
            await prisma.userOAuth.create({
              data: {
                userId: user.id,
                youtubeAccessToken: user.youtubeAccessToken || null,
                youtubeRefreshToken: user.youtubeRefreshToken || null,
                youtubeTokenExpiry: user.youtubeTokenExpiry || null,
                youtubeChannelId: user.youtubeChannelId || null,
                youtubeChannelName: user.youtubeChannelName || null,
                youtubeChannelThumb: user.youtubeChannelThumb || null,
                facebookAccessToken: user.facebookAccessToken || null,
                facebookPageId: user.facebookPageId || null,
                facebookPageName: user.facebookPageName || null,
                facebookPageThumb: user.facebookPageThumb || null,
                socialAccounts: user.socialAccounts || {},
              },
            });
            oauthCreated++;
          }

          processedCount++;
        } catch (err) {
          logger.error(`❌ Error migrating user ${user.id}:`, err.message);
        }
      })
    );

    logger.info(`Progress: ${Math.min(i + BATCH_SIZE, users.length}/${users.length}`));
  }

  logger.info("\n✨ Migration complete!");
  logger.info(`- Total Users Processed: ${processedCount}`);
  logger.info(`- Profiles Created: ${profileCreated}`);
  logger.info(`- OAuth Records Created: ${oauthCreated}`);

  await prisma.$disconnect();
}

migrateUserDecomposition().catch((err) => {
  logger.error("FATAL ERROR:", err);
  process.exit(1);
});
