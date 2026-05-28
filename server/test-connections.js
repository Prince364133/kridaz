import 'dotenv/config';
import pg from 'pg';

async function testConnections() {
  console.log("Testing PostgreSQL Connection...");
  console.log("URL:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL + "?sslmode=disable",
    connectionTimeoutMillis: 5000,
    ssl: false
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log("✅ PostgreSQL connected successfully!", res.rows[0]);
  } catch (err) {
    console.error("❌ PostgreSQL connection failed (No SSL):", err.message);
  } finally {
    await pool.end();
  }
}

testConnections();
