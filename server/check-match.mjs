import { prisma } from './config/prisma.js';

async function getPlayerName(id) {
  if (!id) return 'N/A';
  const user = await prisma.user.findUnique({ where: { id } });
  if (user) return user.name;
  const custom = await prisma.customPlayerInvite.findUnique({ where: { id } });
  if (custom) return custom.name;
  return 'Unknown';
}

async function main() {
  const match = await prisma.cricketMatch.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      timeline: { orderBy: { timestamp: 'asc' } }
    }
  });

  console.log("MATCH INFO CURRENT:");
  console.log(`Match ID: ${match.id}`);
  console.log(`Striker ID: ${match.strikerId} (${await getPlayerName(match.strikerId)})`);
  console.log(`Non-Striker ID: ${match.nonStrikerId} (${await getPlayerName(match.nonStrikerId)})`);
  console.log(`Bowler ID: ${match.bowlerId} (${await getPlayerName(match.bowlerId)})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
