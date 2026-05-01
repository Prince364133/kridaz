
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TurfSchema = new mongoose.Schema({
  status: String,
  isActive: Boolean,
});

const Turf = mongoose.model('Turf', TurfSchema);

async function approveAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const result = await Turf.updateMany({}, { status: 'approved', isActive: true });
    console.log(`Updated ${result.modifiedCount} turfs to approved.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

approveAll();
