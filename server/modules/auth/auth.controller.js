import * as argon2 from "argon2";
import chalk from "chalk";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import OwnerRequest from "../../models/ownerRequest.model.js";
import OTP from "../../models/otp.model.js";
import { generateUserToken, generateOwnerToken } from "../../utils/generateJwtToken.js";
import generateEmail from "../../utils/generateEmail.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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
  const { name, email, password, phone, gender, location, otp } = req.body;

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

    const newUser = new User({ name, email, password: hashedPassword, phone, gender, location });
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
      .json({ success: true, message: "User created successfully", token });
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
      role 
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
        user = new User({ name, email, googleId });
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
      role: roleToReturn 
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
  const userId = req.user?.id; // Assuming user is authenticated

  try {
    const user = await User.findById(userId);
    const professionalRoles = ["owner", "VENUE_OWNER", "VERIFIED_VENUE_OWNER", "COACH", "UMPIRE", "admin", "BMSP_ADMIN"];
    
    if (user && professionalRoles.includes(user.role)) {
      return res.status(400).json({ 
        success: false, 
        message: `You already have the ${user.role} role. One account can only have one professional dashboard.` 
      });
    }

    const existingRequest = await OwnerRequest.findOne({ email, status: "pending" });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: "A pending request already exists for this email" });
    }

    const newRequest = new OwnerRequest({
      userId,
      name,
      email,
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
    console.error(chalk.red(err.message));
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
