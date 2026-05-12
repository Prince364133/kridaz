import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Owner from './models/owner.model.js';
import './models/booking.model.js';
import './models/hostedGame.model.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const id = '6a00ef0b8272370cbd8378eb';
    
    const professional = await Owner.findOne({ _id: id, role: { $in: ['umpire', 'coach'] } })
      .populate('bookings')
      .populate('certifications')
      .lean();

    if (!professional) {
      console.log('Not found in DB');
    } else {
      console.log('FOUND:', professional.name);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
