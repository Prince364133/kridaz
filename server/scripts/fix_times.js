import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Turf = (await import('../models/turf.model.js')).default;
    
    const res1 = await Turf.updateMany({ openTime: '06:00' }, { $set: { openTime: '06:00 AM' } });
    const res2 = await Turf.updateMany({ openTime: '05:00' }, { $set: { openTime: '05:00 AM' } });
    const res3 = await Turf.updateMany({ openTime: '07:00' }, { $set: { openTime: '07:00 AM' } });
    const res4 = await Turf.updateMany({ closeTime: '23:00' }, { $set: { closeTime: '11:00 PM' } });
    const res5 = await Turf.updateMany({ closeTime: '22:00' }, { $set: { closeTime: '10:00 PM' } });
    const res6 = await Turf.updateMany({ closeTime: '00:00' }, { $set: { closeTime: '12:00 AM' } });
    
    console.log('Fixed time formats', { res1, res2, res3, res4, res5, res6 });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fix();
