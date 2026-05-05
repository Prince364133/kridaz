import * as argon2 from "argon2";
import chalk from "chalk";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import OwnerRequest from "../../models/ownerRequest.model.js";
import OTP from "../../models/otp.model.js";
import { generateUserToken, generateOwnerToken } from "../../utils/generateJwtToken.js";
import generateEmail from "../../utils/generateEmail.js";
import cloudinary from "../../utils/cloudinary.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateUniqueUsername = async (baseName) => {
  let username = baseName ? baseName.toLowerCase().replace(/[^a-z0-9]/g, '') : "player";
  if (!username) username = "player";
  
  let isUnique = false;
  let counter = 0;
  let finalUsername = username;
  
  while (!isUnique) {
    const existing = await User.findOne({ username: finalUsername });
    if (!existing) {
      isUnique = true;
    } else {
      counter++;
      finalUsername = `${username}${counter}`;
    }
  }
  return finalUsername;
};

// Check Username Availability
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }
    const existing = await User.findOne({ username: username.toLowerCase() });
    return res.status(200).json({ success: true, available: !existing });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Send OTP for Registration
export const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    const existingOwner = await Owner.findOne({ email });
    
    if (existingUser || existingOwner) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const otp = generateOTP();
    await OTP.findOneAndDelete({ email });
    const newOtp = new OTP({ email, otp });
    await newOtp.save();

    await generateEmail(
      email,
      "Your BookMySportz Verification Code",
      `<p>Your verification code is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`
    );

    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error(chalk.red(err.message));
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// User Registration
export const registerUser = async (req, res) => {
  const { name, email, password, phone, gender, location, otp, username } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    const existingOwner = await Owner.findOne({ email });
    if (existingUser || existingOwner) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    if (username) {
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const hashedPassword = await argon2.hash(password);
    const finalUsername = username ? username.toLowerCase() : await generateUniqueUsername(name);

    const newUser = new User({ name, username: finalUsername, email, password: hashedPassword, phone, gender, location });
    await newUser.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateUserToken(newUser._id);

    // Set cookie for shared auth between portals
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res
      .status(201)
      .json({ success: true, message: "User created successfully", token, user: newUser });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Owner Registration
export const registerOwner = async (req, res) => {
  const { name, email, phone, password, role, gender, location, otp } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    const existingOwner = await Owner.findOne({ email });
    if (existingUser || existingOwner) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
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
      gender,
      location,
      waitlistPosition,
    });
    await newOwner.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateOwnerToken(newOwner);

    // Set cookie for shared auth between portals
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      success: true,
      message: waitlistPosition ? "You've been added to the waitlist!" : "Account created successfully",
      token,
      role: newOwner.role,
      waitlistNumber: waitlistPosition,
    });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Login Step 1 (Now Unified Login)
export const loginStep1 = async (req, res) => {
  const { email, password } = req.body;
  try {
    const owner = await Owner.findOne({ email });
    let account = owner || await User.findOne({ email });

    if (!account) {
      return res.status(400).json({ success: false, message: "Account does not exist" });
    }

    if (account.password) {
      const isPasswordCorrect = await argon2.verify(account.password, password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, message: "Incorrect password" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Please log in with Google" });
    }

    let role;
    let token;
    if (owner) {
      role = owner.role;
      token = generateOwnerToken(owner);
    } else {
      role = "user";
      token = generateUserToken(account._id);
    }

    // Set cookie for shared auth between portals
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token, 
      role,
      user: account,
      requiresOtp: false 
    });
  } catch (err) {
    console.error(chalk.red(err.message));
    return res.status(500).json({ success: false, message: "Failed to process login" });
  }
};

// Unified Login
export const login = async (req, res) => {
  const { email, password, otp } = req.body;
  console.log("Unified login attempt for:", email);
  try {
    const owner = await Owner.findOne({ email });
    let role = "user";
    let token;
    let account = owner || await User.findOne({ email });

    if (!account) {
      return res.status(400).json({ success: false, message: "Account does not exist" });
    }

    const isPasswordCorrect = await argon2.verify(account.password, password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (owner) {
      role = owner.role;
      token = generateOwnerToken(owner);
    } else {
      role = "user";
      token = generateUserToken(account._id);
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    // Set cookie for shared auth between portals
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token, 
      role,
      user: account
    });
  } catch (err) {
    console.error(chalk.red("Login error:"), err);
    return res.status(500).json({ success: false, message: "Internal server error during login" });
  }
};

// Google Auth
export const googleAuth = async (req, res) => {
  const { credential, role: requestedRole } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name, email, sub: googleId } = ticket.getPayload();

    let owner = await Owner.findOne({ email });
    let user = await User.findOne({ email });
    let token;
    let roleToReturn;

    if (owner) {
      roleToReturn = owner.role;
      token = generateOwnerToken(owner);
    } else if (user) {
      roleToReturn = "user";
      token = generateUserToken(user._id);
    } else {
      // New account creation via Google
      if (requestedRole && requestedRole !== "user") {
        let waitlistPosition = null;
        if (requestedRole === "coach" || requestedRole === "umpire") {
          const count = await Owner.countDocuments({ role: { $in: ["coach", "umpire"] } });
          waitlistPosition = count + 1;
        }
        owner = new Owner({
          name,
          email,
          googleId,
          role: requestedRole,
          waitlistPosition,
        });
        await owner.save();
        roleToReturn = owner.role;
        token = generateOwnerToken(owner);
      } else {
        const generatedUsername = await generateUniqueUsername(name);
        user = new User({ name, username: generatedUsername, email, googleId });
        await user.save();
        roleToReturn = "user";
        token = generateUserToken(user._id);
      }
    }

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ 
      success: true, 
      message: "Google authentication successful", 
      token, 
      role: roleToReturn,
      user: owner || user
    });
  } catch (error) {
    console.error(chalk.red("Google Auth Error:"), error);
    return res.status(400).json({ success: false, message: "Google authentication failed" });
  }
};

// Logout
export const logout = async (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
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

// Submit Role Upgrade Request
export const upgradeRequest = async (req, res) => {
  const { name, email, phone, role, businessDetails, documents } = req.body;
  const userId = req.user?.id;

  try {
    // 1. Check if user already has a professional role
    const ownerAccount = await Owner.findOne({ email: email.toLowerCase() });
    if (ownerAccount) {
      return res.status(400).json({ 
        success: false, 
        message: `Account already has a professional role (${ownerAccount.role}).` 
      });
    }

    // 2. Check for existing requests
    const existingRequest = await OwnerRequest.findOne({ email: email.toLowerCase() });
    
    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({ 
          success: false, 
          message: "You already have a pending application. Please wait for our team to review it." 
        });
      }
      
      if (existingRequest.status === "approved") {
        return res.status(400).json({ 
          success: false, 
          message: "Your application has already been approved." 
        });
      }

      // If rejected, we allow re-submission by deleting the old one
      if (existingRequest.status === "rejected") {
        await OwnerRequest.deleteOne({ _id: existingRequest._id });
      }
    }

    // 3. Create new request
    const newRequest = new OwnerRequest({
      userId,
      name,
      email: email.toLowerCase(),
      phone,
      role: role || "owner",
      businessDetails,
      documents,
      status: "pending",
    });

    await newRequest.save();
    
    return res.status(201).json({
      success: true,
      message: "Your application has been submitted and is under review.",
    });
  } catch (err) {
    console.error(chalk.red("Upgrade Request Error:"), err);
    
    // Handle Mongoose duplicate key error specifically
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "An application with this email already exists." 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: err.message || "Internal server error" 
    });
  }
};

// Get Current User Profile (Auto-Login Support)
export const getMe = async (req, res) => {
  try {
    // req.user is attached by user.middleware.js
    // req.owner is attached by owner.middleware.js
    const decoded = req.user || req.owner;
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, role } = decoded;
    let account;

    if (role === "user") {
      account = await User.findById(id).select("-password");
    } else {
      account = await Owner.findById(id).select("-password");
    }

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    return res.status(200).json({ 
      success: true, 
      user: account, 
      role 
    });
  } catch (err) {
    console.error(chalk.red("getMe Error:"), err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Profile Picture
export const updateProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file provided" });
  }

  try {
    const decoded = req.user || req.owner;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, role } = decoded;
    
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `BookMySportz/profiles/${role}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let account;
    if (role === "user") {
      account = await User.findByIdAndUpdate(id, { profilePicture: uploadResult.secure_url }, { new: true });
    } else {
      account = await Owner.findByIdAndUpdate(id, { profilePicture: uploadResult.secure_url }, { new: true });
    }

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: uploadResult.secure_url
    });
  } catch (err) {
    console.error(chalk.red("updateProfilePicture Error:"), err);
    return res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
};

export const updateInterests = async (req, res) => {
  const { sportTypes } = req.body;
  try {
    const id = req.user.id;
    let account = await User.findByIdAndUpdate(id, { sportTypes }, { new: true });
    
    if (!account) {
      account = await Owner.findByIdAndUpdate(id, { sportTypes }, { new: true });
    }

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    
    return res.status(200).json({ success: true, message: "Interests updated", sportTypes: account.sportTypes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const updateProfile = async (req, res) => {
  const { name, username, phone, bio, gender, city, state } = req.body;
  try {
    const decoded = req.user || req.owner;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, role } = decoded;

    // Check if username is taken by another user
    if (username) {
      const existing = await User.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
    }

    let account;
    const updateData = {
      name,
      username: username?.toLowerCase(),
      phone,
      bio,
      gender,
      city,
      state
    };

    if (role === "user") {
      account = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
    } else {
      account = await Owner.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
    }

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: account
    });
  } catch (err) {
    console.error(chalk.red("updateProfile Error:"), err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
