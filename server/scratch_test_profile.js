import { prisma } from './config/prisma.js';
import SocialService from './services/social.service.js';
import WalletService from './services/wallet.service.js';

async function main() {
  const targetId = "c6265075-c3a4-4aff-8ad4-9235d7af22bb";
  console.log("Testing getPlayerProfile queries for ID:", targetId);

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: { 
      ownerProfile: true,
      profile: true
    }
  });
  console.log("User retrieved:", user ? "YES" : "NO", user);

  if (!user) return;

  // 2. Count bookings
  const bookingCount = await prisma.booking.count({ where: { userId: user.id } });
  console.log("Booking count:", bookingCount);

  // 3. Followers/Following
  const followerIds = await SocialService.getFollowerIds(user.id);
  console.log("Followers:", followerIds);

  const followingIds = await SocialService.getFollowingIds(user.id);
  console.log("Following:", followingIds);

  // 4. User stats
  const userStats = await prisma.userStats.findUnique({ where: { userId: user.id } });
  console.log("User stats:", userStats);

  // 5. Wallet
  const wallet = await WalletService.getWallet(user.id, user.role || 'user');
  console.log("Wallet:", wallet);

  console.log("All queries executed successfully!");
}

main()
  .catch(e => {
    console.error("ERROR EXECUTING PROFILE QUERIES:", e);
    process.exit(1);
  });
