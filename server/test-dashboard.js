import { prisma } from "./config/prisma.js";

async function test() {
  console.log("Starting dashboard queries test...");
  
  const tasks = [
    { name: "totalUsers", run: () => prisma.user.count() },
    { name: "totalOwners", run: () => prisma.ownerProfile.count({ where: { user: { role: { in: ["VENUE_OWNER", "OWNER"] } } } }) },
    { name: "totalTurfs", run: () => prisma.turf.count() },
    { name: "pendingTurfs", run: () => prisma.turf.count({ where: { status: "pending" } }) },
    { name: "totalBookings", run: () => prisma.booking.count() },
    { name: "pendingRequests", run: () => prisma.ownerRequest.count({ where: { status: "pending" } }) },
    { name: "totalCoaches", run: () => prisma.ownerProfile.count({ where: { user: { role: "COACH" } } }) },
    { name: "totalUmpires", run: () => prisma.ownerProfile.count({ where: { user: { role: "UMPIRE" } } }) },
    { name: "totalStreamers", run: () => prisma.ownerProfile.count({ where: { user: { role: "STREAMER" } } }) },
    { name: "totalScorers", run: () => prisma.ownerProfile.count({ where: { user: { role: "SCORER" } } }) },
    { name: "payoutAggr", run: () => prisma.withdrawalRequest.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true }
      }) 
    },
    { name: "openTickets", run: () => prisma.supportTicket.count({ where: { status: "OPEN" } }) },
    { name: "pendingDisputes", run: () => prisma.dispute.count({ where: { status: "PENDING" } }) },
    { name: "totalCommunityPosts", run: () => prisma.post.count() },
    { name: "totalHostedGames", run: () => prisma.hostedGame.count() },
    { name: "publishedBlogs", run: () => prisma.blog.count({ where: { status: "PUBLISHED" } }) },
    { name: "userWalletAggr", run: () => prisma.user.aggregate({
        _sum: { walletBalance: true }
      }) 
    },
    { name: "recentAuditLogs", run: () => prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } }
      }) 
    },
    { name: "bookingHistoryRaw", run: () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return prisma.booking.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true, totalPrice: true }
        });
      }
    }
  ];

  for (const task of tasks) {
    try {
      const result = await task.run();
      console.log(`✅ ${task.name}: Success! Result:`, typeof result === 'object' ? JSON.stringify(result) : result);
    } catch (err) {
      console.error(`❌ ${task.name}: Failed! Error:`, err.message);
      if (err.stack) console.error(err.stack);
    }
  }

  process.exit(0);
}

test().catch(err => {
  console.error("Test function crashed:", err);
  process.exit(1);
});
