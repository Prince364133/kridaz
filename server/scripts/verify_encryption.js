import { prisma } from '../config/prisma.js';
import pkg_pg from 'pg';
import logger from "../utils/logger.js";
const { Pool } = pkg_pg;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function verifyLogic() {
  logger.info('🧪 Verifying Encryption Logic...');
  
  const testEmail = 'encryption_test@kridaz.test';
  const plaintextToken = 'this_is_a_secret_token_123';

  try {
    // 1. Create a user (should trigger encryption)
    logger.info('1. Creating user with plaintext token...');
    const user = await prisma.user.upsert({
      where: { email: testEmail },
      update: { youtubeAccessToken: plaintextToken },
      create: { 
        email: testEmail, 
        password: 'password',
        username: 'encrypt_test_' + Date.now(),
        name: 'Encryption Test User',
        youtubeAccessToken: plaintextToken,
        socialAccounts: [
          { platform: 'youtube', accessToken: plaintextToken }
        ]
      }
    });

    // 2. Check value via Prisma (should be decrypted)
    logger.info('2. Prisma Result (should be plaintext):', user.youtubeAccessToken);
    if (user.youtubeAccessToken === plaintextToken) {
      logger.info('✅ Prisma auto-decryption works!');
    } else {
      logger.info('❌ Prisma auto-decryption FAILED');
    }

    // 3. Check value via Raw DB (should be encrypted)
    logger.info('3. Checking raw database value...');
    const rawResult = await pool.query('SELECT "youtubeAccessToken", "socialAccounts" FROM "User" WHERE email = $1', [testEmail]);
    const rawToken = rawResult.rows[0].youtubeAccessToken;
    const rawSocial = rawResult.rows[0].socialAccounts;

    logger.info('Raw Token in DB:', rawToken);
    
    if (rawToken && rawToken.split(':').length === 3) {
      logger.info('✅ Database value is ENCRYPTED!');
    } else {
      logger.info('❌ Database value is NOT encrypted');
    }

    // Check JSON field
    logger.info('Raw SocialAccounts in DB:', JSON.stringify(rawSocial));
    if (rawSocial[0].accessToken.split(':').length === 3) {
      logger.info('✅ JSON field tokens are ENCRYPTED!');
    } else {
      logger.info('❌ JSON field tokens are NOT encrypted');
    }

  } catch (error) {
    logger.error('💥 Verification FAILED:', error);
  } finally {
    // Cleanup
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await pool.end();
    process.exit(0);
  }
}

verifyLogic();
