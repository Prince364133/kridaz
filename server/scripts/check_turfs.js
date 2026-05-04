import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkTurfs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const turves = await mongoose.connection.db.collection('turves').find({}).toArray();
        console.log('Total Turfs:', turves.length);
        turves.forEach(t => {
            console.log(`ID: ${t._id}, Name: ${t.turfName}, Status: ${t.status}, IsActive: ${t.isActive}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkTurfs();
