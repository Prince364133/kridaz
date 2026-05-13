import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:6001/api";

const runTest = async () => {
  try {
    console.log("🚀 Starting Scorer Workflow Test...");

    // 1. Login as Admin/Host
    console.log("🔐 Logging in as Host...");
    const hostLogin = await axios.post(`${API_URL}/user/auth/login-step1`, {
      email: "admin@kridaz.com",
      password: "364133"
    });
    const hostToken = hostLogin.data.token;
    const hostId = hostLogin.data.user._id;
    console.log("✅ Host Logged in:", hostId);

    // 2. Find Scorer User
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model("User", new mongoose.Schema({ email: String, role: String }));
    const scorerUser = await User.findOne({ email: "testscorer@kridaz.com" });
    if (!scorerUser) throw new Error("Scorer user not found");
    const scorerId = scorerUser._id.toString();
    console.log("✅ Found Scorer User:", scorerId);

    // 3. Create Hosted Game
    console.log("🏟️ Creating Hosted Game...");
    const gameRes = await axios.post(`${API_URL}/hosted-game/create`, {
      gameType: "CRICKET",
      date: new Date().toISOString().split('T')[0],
      time: "14:00",
      city: "Hyderabad",
      state: "Telangana",
      teams: {
        teamA: { name: "Team A", slots: [] },
        teamB: { name: "Team B", slots: [] }
      }
    }, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const gameId = gameRes.data.game._id;
    console.log("✅ Game Created:", gameId);

    // 4. Invite Scorer
    console.log("📧 Inviting Scorer...");
    await axios.post(`${API_URL}/hosted-game/invite-official`, {
      gameId,
      officialId: scorerId,
      type: "SCORER"
    }, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    console.log("✅ Scorer Invited");

    // 5. Login as Scorer
    console.log("🔐 Logging in as Scorer...");
    const scorerLogin = await axios.post(`${API_URL}/user/auth/login-step1`, {
      email: "testscorer@kridaz.com",
      password: "364133"
    });
    const scorerToken = scorerLogin.data.token;
    console.log("✅ Scorer Logged in");

    // 6. Accept Invitation
    console.log("✅ Accepting Invitation...");
    const respondRes = await axios.post(`${API_URL}/hosted-game/respond-to-official-invitation`, {
      gameId,
      action: "APPROVE",
      type: "SCORER"
    }, {
      headers: { Authorization: `Bearer ${scorerToken}` }
    });
    console.log("✅ Invitation Accepted:", respondRes.data.message);
    const newToken = respondRes.data.token;
    console.log("🔄 Using Fresh Token for Dashboard...");

    // 7. Verify Role Change
    const updatedScorer = await User.findById(scorerId);
    console.log("🧐 Verified Scorer Role:", updatedScorer.role);

    // 8. Fetch Dashboard
    console.log("📊 Fetching Scorer Dashboard...");
    const dashboardRes = await axios.get(`${API_URL}/scorer/dashboard`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    // 9. Verify Host Notification
    const Notification = mongoose.model("Notification", new mongoose.Schema({ recipient: mongoose.Schema.Types.ObjectId, title: String }));
    const notif = await Notification.findOne({ recipient: hostId }).sort({ createdAt: -1 });
    console.log("🔔 Verified Host Notification:", notif?.title);

    await mongoose.disconnect();
    console.log("✨ Test Completed Successfully!");
  } catch (err) {
    console.error("❌ Test Failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
};

runTest();
