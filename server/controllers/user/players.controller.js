import chalk from "chalk";
import User from "../../models/user.model.js";

/**
 * GET /user/players
 * Public endpoint — returns a sanitized list of signed-up players.
 * Only exposes: _id, name, bookings count, createdAt.
 * Password and email are NEVER returned.
 */
export const getPublicPlayers = async (req, res) => {
  try {
    // Select only safe public fields — explicitly exclude password & email
    const users = await User.find({}, { name: 1, bookings: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(20); // show latest 20 signups

    const players = users.map((u) => ({
      _id: u._id,
      name: u.name,
      bookingCount: u.bookings?.length ?? 0,
      joinedAt: u.createdAt,
    }));

    return res.status(200).json({ success: true, players });
  } catch (err) {
    console.log(chalk.red("Error in getPublicPlayers"), err);
    return res.status(500).json({ message: err.message });
  }
};
