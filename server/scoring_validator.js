/**
 * KRIDAZ SCORING VALIDATOR
 * Walkthrough script to test all match lifecycle scenarios and find bugs.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HostedGame from './models/hostedGame.model.js';
import CricketScoring from './models/cricketScoring.model.js';
import { updateScore, startNextInnings, setPlayers, setToss, startScoring } from './modules/scoring/scoring.controller.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kridaz";

async function runTests() {
  console.log("🚀 Starting Scoring Validation...");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to Database");

    // Cleanup previous tests
    await HostedGame.deleteMany({ gameType: 'TEST_MATCH' });
    await CricketScoring.deleteMany({});

    // 1. Create a Match
    const match = await HostedGame.create({
      host: new mongoose.Types.ObjectId(),
      gameType: 'TEST_MATCH',
      date: new Date(),
      time: "10:00",
      oversPerInnings: 1, // 1 over for fast testing
      teams: {
        teamA: { 
          name: "Warriors", 
          slots: [
            { user: new mongoose.Types.ObjectId(), role: 'Batsman', status: 'JOINED' }, 
            { user: new mongoose.Types.ObjectId(), role: 'Batsman', status: 'JOINED' }
          ] 
        },
        teamB: { 
          name: "Titans", 
          slots: [
            { user: new mongoose.Types.ObjectId(), role: 'Bowler', status: 'JOINED' },
            { user: new mongoose.Types.ObjectId(), role: 'Batsman', status: 'JOINED' }
          ] 
        }
      }
    });
    console.log(`✅ Match Created: ${match._id}`);

    const teamA_User1 = match.teams.teamA.slots[0].user;
    const teamA_User2 = match.teams.teamA.slots[1].user;
    const teamB_User1 = match.teams.teamB.slots[0].user;
    const teamB_User2 = match.teams.teamB.slots[1].user;

    // Mock IO
    const ioMock = {
      to: () => ({
        emit: (event, data) => console.log(`   [Socket Emit] ${event}:`, event === 'scoreUpdated' ? 'Snapshot Data' : data)
      })
    };

    // Helper to wrap controller calls with mock req/res
    const wrap = async (fn, body, params = {}) => {
      let result = null;
      const req = { 
        body, 
        params, 
        app: { get: (key) => key === 'io' ? ioMock : null },
        user: { id: match.host } // Mock authorized user
      };
      const res = { 
        status: (code) => ({ 
          json: (d) => { result = d; return d; } 
        }) 
      };
      await fn(req, res);
      return result;
    };

    // 2. Start Scoring
    console.log("\n🏏 Initializing Scoring Session...");
    const startRes = await wrap(startScoring, { matchId: match._id, battingTeam: 'teamA' }, { matchId: match._id });
    const scoringId = startRes.scoring._id;

    // 3. Set Toss
    console.log("\n🏏 Performing Toss...");
    await wrap(setToss, { scoringId, winnerTeam: 'teamA', decision: 'BAT' }, { matchId: match._id });

    // 4. Set Players
    console.log("\n🏏 Setting Active Players...");
    await wrap(setPlayers, { scoringId, strikerId: teamA_User1, nonStrikerId: teamA_User2, bowlerId: teamB_User1 }, { matchId: match._id });

    // 5. Score 1st Innings (Scenario: 10 runs in 1 over)
    console.log("\n🏏 Scoring 1st Innings...");
    const scoreBalls = [
      { ballData: { runs: 4, isBoundary: true } },
      { ballData: { runs: 1, isExtra: true, extraType: 'WIDE' } }, 
      { ballData: { runs: 6, isBoundary: true } },
      { ballData: { runs: 0, isWicket: true, wicketType: 'BOWLED' } }, // 4th legal ball
      { ballData: { runs: 0 } },
      { ballData: { runs: 0 } }, // 6th legal ball
    ];

    console.log(`🏏 Scoring 1st Innings (3 balls)...`);
    for (const ball of scoreBalls) {
      const res = await wrap(updateScore, { scoringId, ballData: { ...ball.ballData, batterId: teamA_User1, bowlerId: teamB_User1 } }, { matchId: match._id });
      if (!res?.success) {
        throw new Error(`Ball update failed: ${res?.message || 'Unknown error'}`);
      }
      console.log(`  ✅ Ball recorded: ${ball.ballData.isExtra ? ball.ballData.extraType : ball.ballData.runs + ' runs'}`);
    }

    let scoring = await CricketScoring.findById(scoringId);
    console.log(`📊 1st Innings Score: ${scoring.innings[0].totalRuns}/${scoring.innings[0].totalWickets} in ${scoring.innings[0].totalBalls} balls`);

    if (scoring.innings[0].totalRuns !== 11 || scoring.innings[0].totalWickets !== 1) {
      console.error(`❌ BUG FOUND: Score should be 11/1. Got ${scoring.innings[0].totalRuns}/${scoring.innings[0].totalWickets}`);
    } else {
      console.log("✅ 1st Innings score calculation is CORRECT (11/1)");
    }

    // 6. Start 2nd Innings
    console.log("\n🏏 Starting 2nd Innings...");
    await wrap(startNextInnings, { scoringId, battingTeamId: 'teamB' }, { matchId: match._id });

    // 7. Set 2nd Innings Players
    console.log("\n🏏 Setting 2nd Innings Players...");
    await wrap(setPlayers, { scoringId, strikerId: teamB_User1, nonStrikerId: teamB_User2, bowlerId: teamA_User1 }, { matchId: match._id });

    // 8. Score 2nd Innings (Scenario: Target Reach)
    console.log("\n🏏 Scoring 2nd Innings Chase...");
    const chaseBalls = [
      { ballData: { runs: 6, isBoundary: true } },
      { ballData: { runs: 6, isBoundary: true } }, // Total 12, target was 12
    ];

    for (const ball of chaseBalls) {
      const res = await wrap(updateScore, { scoringId, ballData: { ...ball.ballData, batterId: teamB_User1, bowlerId: teamA_User1 } }, { matchId: match._id });
      if (!res?.success) {
        throw new Error(`Chase update failed: ${res?.message || 'Unknown error'}`);
      }
      console.log(`  ✅ Chase Ball recorded: ${ball.ballData.runs} runs`);
    }

    const finalMatch = await HostedGame.findById(match._id);
    const finalScoring = await CricketScoring.findOne({ matchId: match._id });

    console.log(`\n📊 Final Match Status: ${finalMatch.status}`);
    console.log(`📊 Final Score Status: ${finalScoring.status}`);
    console.log(`📊 Result: ${finalScoring.result}`);

    if (finalMatch.status === 'COMPLETED' && finalScoring.result.includes("won")) {
      console.log("\n🏆 ALL TESTS PASSED: E2E Scoring Lifecycle Verified.");
    } else {
      console.error("\n❌ BUG FOUND: Match should be COMPLETED and a winner declared");
    }

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Tests finished.");
    process.exit();
  }
}

runTests();
