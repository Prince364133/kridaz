import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const matchUmpireId = '6a00ee308272370cbd83780b';
const requestUmpireId = '6a00ef0b8272370cbd8378eb';

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Owner = mongoose.model('Owner', new mongoose.Schema({}, { strict: false }));

    console.log('--- Match Umpire ID Inspection ---');
    const u1 = await User.findById(matchUmpireId);
    const o1 = await Owner.findById(matchUmpireId);
    console.log('As User:', u1 ? u1.email || u1.name : 'Not Found');
    console.log('As Owner:', o1 ? o1.email || o1.businessName : 'Not Found');

    console.log('\n--- Request Umpire ID Inspection ---');
    const u2 = await User.findById(requestUmpireId);
    const o2 = await Owner.findById(requestUmpireId);
    console.log('As User:', u2 ? u2.email || u2.name : 'Not Found');
    console.log('As Owner:', o2 ? o2.email || o2.businessName : 'Not Found');

    if (o1 && o1.userId) {
       console.log('\nMatch Umpire Owner points to User:', o1.userId);
    }
    if (o2 && o2.userId) {
       console.log('Request Umpire Owner points to User:', o2.userId);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
