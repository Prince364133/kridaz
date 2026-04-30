import * as argon2 from "argon2";
import chalk from "chalk";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import OwnerRequest from "../../models/ownerRequest.model.js";
import { generateUserToken, generateOwnerToken } from "../../utils/generateJwtToken.js";

// User Registration
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await argon2.hash(password);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    const token = generateUserToken(newUser._id);
    return res
      .status(201)
      .json({ success: true, message: "User created successfully", token });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Owner Registration
export const registerOwner = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const owner = await Owner.findOne({ email });
    if (owner) {
      return res
        .status(400)
        .json({ success: false, message: "Owner already exists" });
    }
    const hashedPassword = await argon2.hash(password);

    let waitlistPosition = null;
    if (role === "coach" || role === "umpire") {
      const count = await Owner.countDocuments({ role: { $in: ["coach", "umpire"] } });
      waitlistPosition = count + 1;
    }

    const newOwner = new Owner({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "owner",
      waitlistPosition,
    });
    await newOwner.save();
    const token = generateOwnerToken(newOwner);
    return res.status(201).json({
      success: true,
      message: waitlistPosition ? "You've been added to the waitlist!" : "Owner created successfully",
      token,
      role: newOwner.role,
      waitlistNumber: waitlistPosition,
    });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Unified Login
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Check User collection
    let user = await User.findOne({ email });
    let role = "user";
    let token;

    if (user) {
      const isPasswordCorrect = await argon2.verify(user.password, password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, message: "Incorrect password" });
      }
      token = generateUserToken(user._id);
    } else {
      // 2. Check Owner collection if not found in User
      const owner = await Owner.findOne({ email });
      if (!owner) {
        return res.status(400).json({ success: false, message: "Account does not exist" });
      }
      const isPasswordCorrect = await argon2.verify(owner.password, password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, message: "Incorrect password" });
      }
      role = owner.role;
      token = generateOwnerToken(owner);
    }

    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token, 
      role 
    });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Owner Request (Waitlist/Inquiry)
export const ownerRequest = async (req, res) => {
  const { name, email, phone, role } = req.body;
  try {
    const existingRequest = await OwnerRequest.findOne({ email });
    if (existingRequest) {
      return res
        .status(400)
        .json({ success: false, message: "Owner request already exists" });
    }
    const newOwnerRequest = new OwnerRequest({
      name,
      email,
      phone,
      role: role || "owner",
    });
    await newOwnerRequest.save();
    return res
      .status(201)
      .json({ success: true, message: "Owner request created successfully" });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};
