import mongoose from "mongoose";
import dotenv from "dotenv";
import { parse, format, isValid, addMinutes, isBefore } from "date-fns";

dotenv.config();

const backfillSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    const Turf = mongoose.model("Turf", new mongoose.Schema({}, { strict: false }), "turves");
    const turves = await Turf.find({ 
      $or: [
        { generatedSlots: { $exists: false } },
        { generatedSlots: { $size: 0 } }
      ]
    });

    console.log(`Found ${turves.length} turfs with missing slots.`);

    for (const t of turves) {
      if (!t.openTime || !t.closeTime) {
        console.log(`Skipping ${t.name} (missing times)`);
        continue;
      }

      console.log(`Generating slots for ${t.name}...`);
      
      const slotDuration = t.slotDuration || 60;
      const breakTime = t.breakTime || 0;
      
      // Try to parse time formats
      const formats = ["HH:mm", "h:mm aa", "hh:mm aa", "H:mm"];
      let openDate, closeDate;

      for (const fmt of formats) {
        const pOpen = parse(t.openTime, fmt, new Date());
        const pClose = parse(t.closeTime, fmt, new Date());
        if (isValid(pOpen)) openDate = pOpen;
        if (isValid(pClose)) closeDate = pClose;
        if (openDate && closeDate) break;
      }

      if (!openDate || !closeDate) {
        console.log(`Could not parse times for ${t.name}: Open=${t.openTime}, Close=${t.closeTime}`);
        continue;
      }

      const slots = [];
      let current = new Date(openDate);
      let end = new Date(closeDate);

      if (end <= current) {
        end.setDate(end.getDate() + 1);
      }

      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = addMinutes(slotStart, slotDuration);

        if (slotEnd <= end) {
          slots.push({
            startTime: format(slotStart, "hh:mm aa"),
            endTime: format(slotEnd, "hh:mm aa"),
            isActive: true
          });
        }
        current = addMinutes(slotEnd, breakTime);
      }

      await Turf.updateOne({ _id: t._id }, { $set: { generatedSlots: slots } });
      console.log(`Successfully generated ${slots.length} slots for ${t.name}`);
    }

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

backfillSlots();
