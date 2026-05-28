import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres:ycbISKffkpJtxTaXOUBVoLALdTBtTTXP@kodama.proxy.rlwy.net:49265/railway'
});

async function test() {
  try {
    await client.connect();
    console.log('Connected directly without sslmode!');
    await client.end();
  } catch (err) {
    console.error('Direct connection failed:', err.message);
  }
}

test();
