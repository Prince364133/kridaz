import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Turf = (await import('../models/turf.model.js')).default;
    
    const turfs = await Turf.find({});
    console.log('Total turfs:', turfs.length);
    
    for (const t of turfs) {
      console.log(`Turf: ${t.name} (${t._id})`);
      console.log(`  openTime: "${t.openTime}"`);
      console.log(`  closeTime: "${t.closeTime}"`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
