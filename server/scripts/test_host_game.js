import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:6001/api";

const testHostGame = async () => {
  try {
    console.log("🚀 Starting Hosted Game Test...");

    // 1. Login
    console.log("🔐 Logging in...");
    const loginRes = await axios.post(`${API_URL}/user/auth/login-step1`, {
      email: "admin@kridaz.com",
      password: "364133"
    });

    const token = loginRes.data.token;
    const user = loginRes.data.user;
    console.log("✅ Logged in as:", user.name, "(Role:", user.role, ")");

    // 2. Prepare Game Data
    const gameData = {
      gameType: "CRICKET",
      date: "2026-05-28",
      time: "14:00",
      groundId: null, // Self-arranged
      umpireId: null,
      perPlayerCharge: 100,
      teamA: {
        name: "Warriors",
        slots: [
          { role: "Batsman" },
          { role: "Bowler" }
        ]
      },
      teamB: {
        name: "Titans",
        slots: [
          { role: "Batsman" },
          { role: "Bowler" }
        ]
      },
      city: "Hyderabad",
      state: "Telangana"
    };

    // 3. Create Hosted Game
    console.log("🏟️ Creating Hosted Game...");
    try {
      const createRes = await axios.post(`${API_URL}/hosted-game/create`, gameData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("🎉 SUCCESS! Game Created:", createRes.data.game._id);
      console.log("Short ID:", createRes.data.game.shortId);
    } catch (err) {
      console.error("❌ FAILED to create game:");
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Message:", err.response.data.message);
        if (err.response.data.error) console.error("Error Detail:", err.response.data.error);
      } else {
        console.error(err.message);
      }
    }

  } catch (error) {
    console.error("❌ Test Script Error:", error.message);
    if (error.response) {
      console.error("Login Status:", error.response.status);
      console.error("Login Message:", error.response.data.message);
    }
  }
};

testHostGame();
