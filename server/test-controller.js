import { prisma } from './config/prisma.js';

async function main() {
  console.log("Running controller query simulation...");
  try {
    const turfs = await prisma.turf.findMany({
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                profilePicture: true
              }
            }
          }
        },
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Query returned ${turfs.length} turfs.`);
    const formattedTurfs = turfs.map(t => {
      const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = t.reviews.length > 0 ? (totalRating / t.reviews.length) : 0;
      
      return {
        ...t,
        avgRating,
        owner: t.owner ? {
          id: t.owner.id,
          name: t.owner.user?.name || '',
          email: t.owner.user?.email || '',
          phoneNumber: t.owner.user?.phone || '',
          profileImage: t.owner.user?.profilePicture || null,
          userId: t.owner.user ? {
            id: t.owner.user.id,
            name: t.owner.user.name,
            username: t.owner.user.username
          } : null
        } : null
      };
    });

    console.log("Formatted Turfs:", JSON.stringify(formattedTurfs, null, 2));
  } catch (error) {
    console.error("Prisma error in query simulation:", error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
