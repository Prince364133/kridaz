import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const matchId = '6a0197b63509da3cde309232';

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const HostedGame = mongoose.model('HostedGame', new mongoose.Schema({}, { strict: false }));
    const match = await HostedGame.findById(matchId);

    if (!match) {
      console.log('Match not found');
    } else {
      console.log('Match Data:');
      console.log(JSON.stringify(match, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
