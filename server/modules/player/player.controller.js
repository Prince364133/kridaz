import User from "../../models/user.model.js";

export const getPublicPlayers = async (req, res) => {
  const { lat, lng, city, state, sport } = req.query;
  try {
    let pipeline = [];

    // 1. Proximity Search
    if (lat && lng) {
      const geoNearStage = {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          spherical: true,
          query: {}
        }
      };

      if (city) geoNearStage.$geoNear.query.city = { $regex: new RegExp(`^${city}$`, "i") };
      if (state) geoNearStage.$geoNear.query.state = { $regex: new RegExp(`^${state}$`, "i") };
      if (sport) geoNearStage.$geoNear.query.sportTypes = { $regex: new RegExp(`^${sport}$`, "i") };

      pipeline.push(geoNearStage);
    } else {
      let matchQuery = {};
      if (city) matchQuery.city = { $regex: new RegExp(`^${city}$`, "i") };
      if (state) matchQuery.state = { $regex: new RegExp(`^${state}$`, "i") };
      if (sport) matchQuery.sportTypes = { $regex: new RegExp(`^${sport}$`, "i") };
      
      pipeline.push({ $match: matchQuery });
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push({ $limit: 50 }); // Higher limit for discovery

    const users = await User.aggregate(pipeline);

    const players = users.map((u) => ({
      _id: u._id,
      name: u.name,
      bookingCount: u.bookings?.length ?? 0,
      joinedAt: u.createdAt,
      profilePicture: u.profilePicture,
      location: u.location || u.city || "Nearby",
      city: u.city,
      state: u.state,
      sportTypes: u.sportTypes || [],
      distance: u.distance ? (u.distance / 1000).toFixed(1) : null // in km
    }));

    return res.status(200).json({ success: true, players });
  } catch (err) {
    console.error("Error in getPublicPlayers", err);
    return res.status(500).json({ message: err.message });
  }
};
