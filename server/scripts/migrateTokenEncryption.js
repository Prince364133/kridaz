import { prisma } from '../config/prisma.js';
import { isEncrypted } from '../utils/encryption.js';

/**
 * Migration script to encrypt existing plaintext OAuth tokens in the database.
 * This script leverages the Prisma Client Extension to transparently handle encryption.
 * Since the extension is already active in prisma.js, reading a user will provide 
 * the "clean" token (decrypted or plaintext fallback), and updating will trigger 
 * the encryption hook.
 */
async function migrate() {
  console.log('🚀 Starting OAuth token migration...');
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        youtubeAccessToken: true,
        youtubeRefreshToken: true,
        facebookAccessToken: true,
        socialAccounts: true
      }
    });

    console.log(`📊 Found ${users.length} users to check.`);

    let updatedCount = 0;
    let skipCount = 0;

    for (const user of users) {
      // We check if any of the fields actually need an update (i.e. they are NOT currently encrypted in the raw DB)
      // Note: user.youtubeAccessToken here is ALREADY processed by the 'result' hook (decrypted).
      // To check if the DB has plaintext, we'd need a raw query, but we can just trigger an update
      // and the 'query' hook will only encrypt if it's not already encrypted.
      
      // We'll perform a dummy update to trigger the extension hooks.
      // The extension's query hook is smart: it checks !isEncrypted(data[field]) before encrypting.
      
      const hasTokens = user.youtubeAccessToken || 
                        user.youtubeRefreshToken || 
                        user.facebookAccessToken || 
                        (Array.isArray(user.socialAccounts) && user.socialAccounts.length > 0);

      if (!hasTokens) {
        skipCount++;
        continue;
      }

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            youtubeAccessToken: user.youtubeAccessToken,
            youtubeRefreshToken: user.youtubeRefreshToken,
            facebookAccessToken: user.facebookAccessToken,
            socialAccounts: user.socialAccounts
          }
        });
        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`✅ Processed ${updatedCount} users...`);
        }
      } catch (err) {
        console.error(`❌ Failed to update user ${user.id} (${user.email}):`, err.message);
      }
    }

    console.log('\n✨ Migration Complete!');
    console.log(`✅ Users Updated: ${updatedCount}`);
    console.log(`⏭️  Users Skipped: ${skipCount}`);
    console.log(`Total Checked: ${users.length}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
