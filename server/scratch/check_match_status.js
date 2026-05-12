import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkMatch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const matchId = '6a0197b63509da3cde309232';
    
    // Use raw collection to avoid model issues if any
    const match = await mongoose.connection.db.collection('hostedgames').findOne({ 
      _id: new mongoose.Types.ObjectId(matchId) 
    });

    if (match) {
      console.log('Match found:', JSON.stringify(match, null, 2));
    } else {
      console.log('Match NOT found for ID:', matchId);
      
      // Try searching by shortId just in case
      const matchByShort = await mongoose.connection.db.collection('hostedgames').findOne({ shortId: matchId });
      if (matchByShort) {
        console.log('Match found by shortId:', JSON.stringify(matchByShort, null, 2));
      } else {
        console.log('No match found by shortId either.');
      }
    }

    const scoring = await mongoose.connection.db.collection('cricketscorings').findOne({ 
      matchId: new mongoose.Types.ObjectId(matchId) 
    });
    
    if (scoring) {
      console.log('Scoring session found:', JSON.stringify(scoring, null, 2));
    } else {
      console.log('No scoring session found for matchId:', matchId);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkMatch();
