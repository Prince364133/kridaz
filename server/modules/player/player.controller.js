import User from "../../models/user.model.js";

export const getPublicPlayers = async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, bookings: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(20);

    const players = users.map((u) => ({
      _id: u._id,
      name: u.name,
      bookingCount: u.bookings?.length ?? 0,
      joinedAt: u.createdAt,
    }));

    return res.status(200).json({ success: true, players });
  } catch (err) {
    console.error("Error in getPublicPlayers", err);
    return res.status(500).json({ message: err.message });
  }
};
