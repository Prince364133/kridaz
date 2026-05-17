import pg from 'pg';
import dotenv from 'dotenv';
import logger from "../utils/logger.js";

dotenv.config();

const { Client } = pg;

const verifyIndexes = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  logger.info('🔍 Verifying Index Usage with EXPLAIN...');

  const queries = [
    {
      name: 'Booking Filter (turf + status + playStartTime)',
      sql: "EXPLAIN SELECT * FROM \"Booking\" WHERE \"turfId\" = 'some-uuid' AND \"status\" = 'CONFIRMED' AND \"playStartTime\" >= NOW() ORDER BY \"playStartTime\" ASC LIMIT 10;"
    },
    {
      name: 'Reel Feed (status + isPrivate + id)',
      sql: "EXPLAIN SELECT * FROM \"Reel\" WHERE \"status\" = 'ready' AND \"isPrivate\" = false ORDER BY \"id\" DESC LIMIT 10;"
    },
    {
      name: 'Message History (chatId + createdAt)',
      sql: "EXPLAIN SELECT * FROM \"Message\" WHERE \"chatId\" = 'some-uuid' ORDER BY \"createdAt\" ASC LIMIT 50;"
    },
    {
      name: 'Turf Search (status + isActive + state + city)',
      sql: "EXPLAIN SELECT * FROM \"Turf\" WHERE \"status\" = 'approved' AND \"isActive\" = true AND \"state\" = 'KA' AND \"city\" = 'Bengaluru' LIMIT 10;"
    }
  ];

  for (const q of queries) {
    logger.info(`\n📊 Testing: ${q.name}`);
    const res = await client.query(q.sql);
    const plan = res.rows.map(r => r['QUERY PLAN']).join('\n');
    logger.info(plan);
    
    if (plan.includes('Index Scan') || plan.includes('Index Only Scan')) {
      logger.info('✅ Index successfully utilized.');
    } else {
      logger.info('⚠️ Sequential Scan detected. Database may need more data or VACUUM ANALYZE to update statistics.');
    }
  }

  await client.end();
};

verifyIndexes();
