import 'dotenv/config';
import pg from 'pg';
import Redis from 'ioredis';

async function testPostgres() {
  console.log('\n── PostgreSQL ──────────────────────────────────');
  console.log('Host:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db, current_user as usr');
    console.log('✅ PostgreSQL LIVE:', res.rows[0]);
    const tables = await client.query(`SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('   Tables in public schema:', tables.rows[0].table_count);
  } catch (err) {
    console.error('❌ PostgreSQL FAILED:', err.message);
  } finally {
    await client.end();
  }
}

async function testRedis() {
  console.log('\n── Redis ───────────────────────────────────────');
  console.log('Host:', process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@'));
  const redis = new Redis(process.env.REDIS_URL, { connectTimeout: 5000, maxRetriesPerRequest: 1 });
  try {
    const pong = await redis.ping();
    const info = await redis.info('server');
    const version = info.match(/redis_version:(.+)/)?.[1]?.trim();
    console.log('✅ Redis LIVE — PING:', pong, '| Version:', version);
    const dbSize = await redis.dbsize();
    console.log('   Keys in DB:', dbSize);
  } catch (err) {
    console.error('❌ Redis FAILED:', err.message);
  } finally {
    redis.disconnect();
  }
}

async function main() {
  console.log('🔍 Checking all connections...\n');
  await testPostgres();
  await testRedis();
  console.log('\n── Done ────────────────────────────────────────\n');
  process.exit(0);
}

main();
