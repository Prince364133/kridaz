import { PrismaClient } from '@prisma/client';
import { fetchLiveScoreSnapshot } from './modules/scoring/scoring.service.js';

const prisma = new PrismaClient();
async function run() {
  const data = await fetchLiveScoreSnapshot('XMMASLOK');
  console.dir(data, { depth: null });
  await prisma.$disconnect();
}
run().catch(console.error);
