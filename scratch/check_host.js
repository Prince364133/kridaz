import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const matchId = '6a0197b63509da3cde309232';
const userId = '6a00ee308272370cbd83780b';

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const HostedGame = mongoose.model('HostedGame', new mongoose.Schema({}, { strict: false }));
    const match = await HostedGame.findById(matchId);

    if (!match) {
      console.log('Match not found');
    } else {
      console.log('Match Host ID:', match.host);
      console.log('Current User ID:', userId);
      console.log('Is User the Host?', match.host?.toString() === userId);
      console.log('Match Umpire ID:', match.umpire);
      console.log('Match Umpire Request:', JSON.stringify(match.umpireRequest, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
