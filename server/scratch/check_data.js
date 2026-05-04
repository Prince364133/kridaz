import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Booking = (await import('./models/booking.model.js')).default;
  const Turf = (await import('./models/turf.model.js')).default;
  const ownerId = '69ee9acb4546aaefe790cddb';
  
  const turfs = await Turf.find({ owner: ownerId });
  const turfIds = turfs.map(t => t._id);
  const bookings = await Booking.find({ turf: { $in: turfIds } });
  
  console.log(JSON.stringify({ 
    ownerId,
    turfCount: turfs.length, 
    bookingCount: bookings.length,
    turfs: turfs.map(t => ({ id: t._id, name: t.name })),
    bookings: bookings.map(b => ({ id: b._id, turf: b.turf }))
  }, null, 2));
  
  await mongoose.disconnect();
}

check();
