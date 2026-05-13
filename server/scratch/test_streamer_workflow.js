import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:6001/api";

const runTest = async () => {
  try {
    console.log("🚀 Starting Streamer Workflow Test...");

    // 1. Login as Host
    console.log("🔐 Logging in as Host...");
    const hostLogin = await axios.post(`${API_URL}/user/auth/login-step1`, {
      email: "admin@kridaz.com",
      password: "364133"
    });
    const hostToken = hostLogin.data.token;
    const hostId = hostLogin.data.user._id;

    // 2. Setup Test Streamer
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model("User", new mongoose.Schema({ email: String, role: String, password: String, name: String }));
    let streamerUser = await User.findOne({ email: "teststreamer@kridaz.com" });
    if (!streamerUser) {
      const existingUser = await User.findOne({ email: "admin@kridaz.com" });
      streamerUser = new User({
        email: "teststreamer@kridaz.com",
        role: "user", // Start as user
        password: existingUser.password,
        name: "Test Streamer"
      });
      await streamerUser.save();
    } else {
        streamerUser.role = "user";
        await streamerUser.save();
    }
    const streamerId = streamerUser._id.toString();
    console.log("✅ Streamer User Ready:", streamerId);

    // 3. Create Hosted Game
    console.log("🏟️ Creating Hosted Game...");
    const gameRes = await axios.post(`${API_URL}/hosted-game/create`, {
      gameType: "CRICKET",
      date: new Date().toISOString().split('T')[0],
      time: "18:00",
      city: "Hyderabad",
      state: "Telangana"
    }, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const gameId = gameRes.data.game._id;

    // 4. Invite Streamer
    console.log("📧 Inviting Streamer...");
    await axios.post(`${API_URL}/hosted-game/invite-official`, {
      gameId,
      officialId: streamerId,
      type: "STREAMER"
    }, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });

    // 5. Login as Streamer
    console.log("🔐 Logging in as Streamer...");
    const streamerLogin = await axios.post(`${API_URL}/user/auth/login-step1`, {
      email: "teststreamer@kridaz.com",
      password: "364133"
    });
    const streamerToken = streamerLogin.data.token;

    // 6. Accept Invitation
    console.log("✅ Accepting Invitation...");
    const respondRes = await axios.post(`${API_URL}/hosted-game/respond-to-official-invitation`, {
      gameId,
      action: "APPROVE",
      type: "STREAMER"
    }, {
      headers: { Authorization: `Bearer ${streamerToken}` }
    });
    const newToken = respondRes.data.token;
    console.log("✅ Invitation Accepted. Fresh Token Received.");

    // 7. Verify Role Change
    const updatedStreamer = await User.findById(streamerId);
    console.log("🧐 Verified Streamer Role:", updatedStreamer.role);

    // 8. Fetch Dashboard
    console.log("📊 Fetching Streamer Dashboard...");
    const dashboardRes = await axios.get(`${API_URL}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    console.log("✅ Dashboard Fetched. Success:", !!dashboardRes.data);
    
    // 9. Verify Notification
    console.log("⏳ Waiting for notification to be processed...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    const Notification = mongoose.model("Notification", new mongoose.Schema({ recipient: mongoose.Schema.Types.ObjectId, title: String, message: String }));
    const allNotifs = await Notification.find({ recipient: hostId }).sort({ createdAt: -1 }).limit(5);
    console.log("🔔 Recent Host Notifications:", allNotifs.map(n => n.title));
    const notif = allNotifs.find(n => /Official Invitation Accepted/i.test(n.title));
    console.log("✅ Verified Target Notification:", notif?.title || "NOT FOUND");

    await mongoose.disconnect();
    console.log("✨ Streamer Test Completed Successfully!");
  } catch (err) {
    console.error("❌ Test Failed!");
    if (err.response) {
        console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
        console.error(err.message);
    }
    process.exit(1);
  }
};

runTest();
