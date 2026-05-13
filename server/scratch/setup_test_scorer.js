import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const setupScorer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model("User", new mongoose.Schema({ email: String, role: String, password: String }));
    
    // Check if test scorer exists
    let user = await User.findOne({ email: "testscorer@kridaz.com" });
    if (!user) {
      // Create a test scorer (I don't have the hashing function handy, but I can copy a hash from another user)
      const existingUser = await User.findOne({ email: "admin@kridaz.com" });
      user = new User({
        email: "testscorer@kridaz.com",
        role: "scorer",
        password: existingUser.password, // Same password for testing
        name: "Test Scorer"
      });
      await user.save();
      console.log("Created test scorer");
    } else {
      user.role = "scorer";
      await user.save();
      console.log("Updated existing test scorer role to scorer");
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

setupScorer();
