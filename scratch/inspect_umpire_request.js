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
      console.log('--- Match Info ---');
      console.log('ID:', match._id);
      console.log('Host ID:', match.host);
      console.log('Umpire Field:', match.umpire);
      console.log('Umpire Request:', JSON.stringify(match.umpireRequest, null, 2));
      
      console.log('\n--- User Info ---');
      console.log('User ID:', userId);
      
      const Owner = mongoose.model('Owner', new mongoose.Schema({}, { strict: false }));
      const owner = await Owner.findOne({ userId });
      console.log('Associated Owner ID:', owner ? owner._id : 'None');
      
      if (owner) {
        const isUmpireInReq = match.umpireRequest?.user?.toString() === owner._id.toString();
        console.log('Is this Owner in the Umpire Request?', isUmpireInReq);
        console.log('Request Status:', match.umpireRequest?.status);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
