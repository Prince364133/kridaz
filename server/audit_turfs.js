import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

async function auditData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const Turf = mongoose.model('Turf', new mongoose.Schema({
      owner: mongoose.Schema.Types.ObjectId,
      name: String
    }), 'turves');

    const turfs = await Turf.find({});
    console.log(`Found ${turfs.length} turfs.`);

    const invalidTurfs = [];
    for (const turf of turfs) {
      if (!turf.owner) {
        console.log(`Turf "${turf.name}" (${turf._id}) has NO owner field!`);
        invalidTurfs.push(turf);
      } else {
        const Owner = mongoose.model('Owner', new mongoose.Schema({}), 'owners');
        const owner = await Owner.findById(turf.owner);
        if (!owner) {
          console.log(`Turf "${turf.name}" (${turf._id}) has owner ID ${turf.owner} which does NOT exist in 'owners' collection!`);
          invalidTurfs.push(turf);
        }
      }
    }

    if (invalidTurfs.length === 0) {
      console.log("All turfs have valid owners.");
    } else {
      console.log(`Found ${invalidTurfs.length} invalid turfs.`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

auditData();
