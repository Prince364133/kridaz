import * as argon2 from "argon2";
import chalk from "chalk";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import OwnerRequest from "../../models/ownerRequest.model.js";
import OTP from "../../models/otp.model.js";
import { generateUserToken, generateOwnerToken, generateRefreshToken } from "../../utils/generateJwtToken.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshToken from "../../models/refreshToken.model.js";
import generateEmail from "../../utils/generateEmail.js";
import cloudinary, { uploadToCloudinary } from "../../utils/cloudinary.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import { sendWhatsAppMessage } from "../../utils/notification.service.js";
import { notifyAdmins } from "../../utils/notificationHelper.js";
import { getIO } from "../../config/socket.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const issueTokens = async (res, userId, token) => {
    const refreshToken = generateRefreshToken(userId);
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    await RefreshToken.create({
        user: userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/" 
    });
};


const generateOTP = () => {
  if (process.env.TEST_OTP) return process.env.TEST_OTP;
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    const existingOwner = await Owner.findOne({ username: username.toLowerCase() });
    return res.status(200).json({ success: true, available: !existingUser && !existingOwner });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Send OTP for Registration (Email & Phone)
export const sendOtp = async (req, res) => {
  const { email, phone } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    const existingOwner = await Owner.findOne({ $or: [{ email }, { phone }] });
    
    if (existingUser || existingOwner) {
      return res.status(400).json({ success: false, message: "Email or Phone already registered" });
    }

    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();

    await OTP.findOneAndDelete({ $or: [{ email }, { phone }] });
    const newOtp = new OTP({ email, phone, emailOtp, phoneOtp });
    await newOtp.save();

    // Send Email (async without await to prevent client timeout)
    generateEmail(
      email,
      "Your Kridaz Verification Code",
      `<p>Your verification code is <strong>${emailOtp}</strong>. It will expire in 10 minutes.</p>`
    );

    // Send WhatsApp
    const otpTemplate = process.env.MSG91_WHATSAPP_OTP_TEMPLATE;
    if (otpTemplate) {
      sendWhatsAppMessage(
        phone,
        "",
        otpTemplate,
        [phoneOtp]
      );
    } else {
      sendWhatsAppMessage(
        phone,
        `Your Kridaz verification code is: ${phoneOtp}. Do not share this with anyone.`
      );
    }

    return res.status(200).json({ 
      success: true, 
      message: "OTPs sent to your email and WhatsApp successfully" 
    });
  } catch (err) {
    console.error(chalk.red(err.message));
    return res.status(500).json({ success: false, message: "Failed to send OTPs" });
  }
};

import HostedGame from "../../models/hostedGame.model.js";

// Check Umpire Invite Details
export const getUmpireInviteDetails = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }
    const game = await HostedGame.findOne({ "customUmpire.inviteToken": token });
    if (!game) {
      return res.status(404).json({ success: false, message: "Invitation not found or expired" });
    }
    return res.status(200).json({ 
      success: true, 
      invite: {
        name: game.customUmpire.name,
        email: game.customUmpire.email,
        phone: game.customUmpire.phone,
        gameId: game._id
      } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const requestUpgrade = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { city, bio, experience, specialization, phone } = req.body;

    // Update payload with form details if provided
    const updatePayload = { 
      upgradeRequested: true,
      ...(city && { city }),
      ...(bio && { bio }),
      ...(phone && { phone }),
      ...(experience && { "businessDetails.experience": experience }),
      ...(specialization && { "businessDetails.specialization": specialization })
    };

    // Try finding by userId first
    let owner = await Owner.findOneAndUpdate(
      { userId },
      updatePayload,
      { new: true }
    );

    // Fallback: If no Owner doc exists for this userId, but the user has a professional role, create one
    if (!owner) {
      const user = await User.findById(userId);
      if (user && user.role?.toLowerCase().includes("umpire")) {
        owner = new Owner({
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: phone || user.phone,
          role: user.role,
          city: city || "",
          bio: bio || "",
          businessDetails: {
            experience: experience || "",
            specialization: specialization || "Cricket"
          },
          upgradeRequested: true
        });
        await owner.save();
      }
    }

    if (!owner) {
      return res.status(404).json({ success: false, message: "Professional profile not found. Please register first." });
    }

    res.status(200).json({ success: true, message: "Upgrade request submitted successfully" });
  } catch (error) {
    console.error("requestUpgrade Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, phone, gender, location, otp, phoneOtp, username, sportTypes, umpireInvite, inviteToken } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email, Phone or Username already registered" });
    }

    const otpRecord = await OTP.findOne({ email, phone });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "No OTP record found. Please resend OTP." });
    }

    // Verify Email OTP (with bypass)
    const isEmailValid = (otp === otpRecord.emailOtp);
    // Verify Phone OTP (with bypass)
    const isPhoneValid = (phoneOtp === otpRecord.phoneOtp);

    if (!isEmailValid || !isPhoneValid) {
      return res.status(400).json({ success: false, message: "Invalid OTPs provided" });
    }

    const hashedPassword = await argon2.hash(password);
    const finalUsername = username ? username.toLowerCase() : await generateUniqueUsername(name);

    let role = "user";
    let inviteGame = null;

    if (umpireInvite) {
      inviteGame = await HostedGame.findOne({ "customUmpire.inviteToken": umpireInvite });
      if (inviteGame) {
        role = "LIMITED_UMPIRE";
      }
    }

    const newUser = new User({ 
      name, 
      username: finalUsername, 
      email, 
      password: hashedPassword, 
      phone, 
      gender, 
      location, 
      sportTypes,
      role,
      walletBalance: 50 // Welcome Bonus
    });
    await newUser.save();
    
    // If it's an umpire invite, create an Owner document as well
    if (role === "LIMITED_UMPIRE") {
      const newOwner = new Owner({
        userId: newUser._id,
        name,
        email,
        phone,
        password: hashedPassword,
        role: "LIMITED_UMPIRE",
        gender,
        location,
        gameTypes: sportTypes
      });
      await newOwner.save();
      
      newUser.ownerDetails = newOwner._id;
      await newUser.save();

      // Update the hosted game
      if (inviteGame) {
        await HostedGame.findOneAndUpdate(
          { "customUmpire.inviteToken": umpireInvite },
          { 
            umpire: newOwner._id,
            "customUmpire.inviteStatus": "ACCEPTED" 
          },
          { new: true }
        );
      }
    }

    // Handle Player Invite
    if (inviteToken) {
      const game = await HostedGame.findOne({ "customPlayers.inviteToken": inviteToken });
      if (game) {
        // Find the specific invite entry
        const inviteEntry = game.customPlayers.find(cp => cp.inviteToken === inviteToken);
        if (inviteEntry) {
          const sIdx = inviteEntry.slotIndex;
          
          // Update the customPlayers entry
          inviteEntry.inviteStatus = "ACCEPTED";
          inviteEntry.user = newUser._id;

          // Also update the corresponding quickSlot
          if (game.quickSlots && game.quickSlots[sIdx]) {
            game.quickSlots[sIdx].user = newUser._id;
            game.quickSlots[sIdx].status = "JOINED";
          }

          await game.save();
        }
      }
    }

    // Create Transaction Record for Welcome Bonus
    await WalletTransaction.create({
      user: newUser._id,
      amount: 50,
      type: "OFFER",
      status: "SUCCESS",
      description: "Platform Welcome Bonus: Rs 50 Credits",
    });

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateUserToken(newUser._id, newUser.role, newUser.ownerDetails);

    await issueTokens(res, newUser ? newUser._id : (account ? account._id : (owner ? owner.userId || owner._id : req.user ? req.user.id : null)), token);

    return res
      .status(201)
      .json({ success: true, message: "User created successfully", token, user: newUser, role });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Owner Registration
export const registerOwner = async (req, res) => {
  const { name, email, phone, password, role, gender, location, otp, phoneOtp } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    const existingOwner = await Owner.findOne({ email });
    if (existingUser || existingOwner) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const otpRecord = await OTP.findOne({ email, phone });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "No OTP record found. Please resend OTP." });
    }

    const isEmailValid = (otp === otpRecord.emailOtp);
    const isPhoneValid = (phoneOtp === otpRecord.phoneOtp);

    if (!isEmailValid || !isPhoneValid) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTPs" });
    }

    const hashedPassword = await argon2.hash(password);

    let waitlistPosition = null;
    if (role === "coach" || role === "umpire") {
      const count = await Owner.countDocuments({ role: { $in: ["coach", "umpire"] } });
      waitlistPosition = count + 1;
    }

    // Every owner MUST have a corresponding User document for unified identity
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "venu_owners",
      gender,
      location,
      isEmailVerified: true
    });
    await newUser.save();

    const newOwner = new Owner({
      userId: newUser._id,
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "venu_owners",
      gender,
      location,
      waitlistPosition,
    });
    await newOwner.save();
    
    // Link owner back to user
    newUser.ownerDetails = newOwner._id;
    await newUser.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateOwnerToken(newUser._id, newOwner.role, newOwner._id);

    await issueTokens(res, newUser ? newUser._id : (account ? account._id : (owner ? owner.userId || owner._id : req.user ? req.user.id : null)), token);

    return res.status(201).json({
      success: true,
      message: waitlistPosition ? "You've been added to the waitlist!" : "Account created successfully",
      token,
      role: newOwner.role,
      user: newUser,
      waitlistNumber: waitlistPosition,
    });
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Login Step 1 (Now Unified Login)
export const loginStep1 = async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.toLowerCase();
  try {
    const owner = await Owner.findOne({ email });
    let account = owner || await User.findOne({ email });

    if (!account) {
      return res.status(400).json({ success: false, message: "Account not found. Please sign up first." });
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
      // Use userId as primary identity if available, fallback to owner._id for legacy compatibility
      token = generateOwnerToken(owner.userId || owner._id, role, owner._id);
    } else {
      role = "user";
      token = generateUserToken(account._id);
    }

    // Send OTP for 2FA for regular users
    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();
    await OTP.findOneAndDelete({ email: account.email });
    const newOtp = new OTP({ 
      email: account.email, 
      phone: account.phone, 
      emailOtp, 
      phoneOtp 
    });
    await newOtp.save();

    generateEmail(
      account.email,
      "Your Kridaz Login Verification Code",
      `<p>Your verification code is <strong>${emailOtp}</strong>. It will expire in 10 minutes.</p>`
    );

    // Send WhatsApp
    if (account.phone) {
      const otpTemplate = process.env.MSG91_WHATSAPP_OTP_TEMPLATE;
      if (otpTemplate) {
        sendWhatsAppMessage(account.phone, "", otpTemplate, [phoneOtp]);
      } else {
        sendWhatsAppMessage(account.phone, `Your Kridaz verification code is: ${phoneOtp}`);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "OTP sent to your email and WhatsApp", 
      requiresOtp: true 
    });
  } catch (err) {
    console.error(chalk.red(err.message));
    return res.status(500).json({ success: false, message: "Failed to process login" });
  }
};

// Unified Login
export const login = async (req, res) => {
  let { email, password, otp } = req.body;
  if (email) email = email.toLowerCase();
  console.log("Unified login attempt for:", email);
  try {
    const owner = await Owner.findOne({ email });
    let role = "user";
    let token;
    let account = owner || await User.findOne({ email });

    if (!account) {
      return res.status(400).json({ success: false, message: "Account not found. Please sign up first." });
    }

    const isPasswordCorrect = await argon2.verify(account.password, password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const otpRecord = await OTP.findOne({ email });
    const isOtpValid = otpRecord && (otp === otpRecord.emailOtp);
    if (!isOtpValid) {
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

    await issueTokens(res, newUser ? newUser._id : (account ? account._id : (owner ? owner.userId || owner._id : req.user ? req.user.id : null)), token);

    if (account.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator." });
    }

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
  const { credential, accessToken, role: requestedRole, umpireInvite, inviteToken, password } = req.body;
  try {
    let payload;

    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else if (accessToken) {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      if (!response.ok) throw new Error("Failed to fetch user info from Google");
      payload = await response.json();
    } else {
      return res.status(400).json({ success: false, message: "No Google credentials provided" });
    }
    
    const { name, email, sub: googleId } = payload;

    let owner = await Owner.findOne({ email });
    let user = await User.findOne({ email });
    let token;
    let roleToReturn;

    if (owner) {
      roleToReturn = owner.role;
      token = generateOwnerToken(owner.userId || owner._id, owner.role, owner._id);
    } else if (user) {
      roleToReturn = "user";
      token = generateUserToken(user._id);
    } else {
      // New account creation via Google
      let hashedPassword = undefined;
      if (password) {
        hashedPassword = await argon2.hash(password);
      }

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
          ...(hashedPassword && { password: hashedPassword }),
        });
        await owner.save();
        roleToReturn = owner.role;
        token = generateOwnerToken(owner.userId || owner._id, owner.role, owner._id);
      } else {
        const generatedUsername = await generateUniqueUsername(name);
        user = new User({ 
          name, 
          username: generatedUsername, 
          email, 
          googleId,
          walletBalance: 50, // Welcome Bonus
          ...(hashedPassword && { password: hashedPassword }),
        });
        await user.save();

        // Create Transaction Record for Welcome Bonus
        await WalletTransaction.create({
          user: user._id,
          amount: 50,
          type: "OFFER",
          status: "SUCCESS",
          description: "Platform Welcome Bonus: Rs 50 Credits",
        });

        roleToReturn = "user";
        token = generateUserToken(user._id);
      }
    }

    // --- HANDLE INVITATIONS (PLAYER OR UMPIRE) ---
    const activeAccount = user || owner;
    if (activeAccount) {
      // 1. Claim Player Invite
      if (inviteToken) {
        const game = await HostedGame.findOne({ "customPlayers.inviteToken": inviteToken });
        if (game) {
          const inviteEntry = game.customPlayers.find(cp => cp.inviteToken === inviteToken);
          if (inviteEntry) {
            const sIdx = inviteEntry.slotIndex;
            inviteEntry.inviteStatus = "ACCEPTED";
            inviteEntry.user = activeAccount._id;

            if (game.quickSlots && game.quickSlots[sIdx]) {
              game.quickSlots[sIdx].user = activeAccount._id;
              game.quickSlots[sIdx].status = "JOINED";
            }
            await game.save();
          }
        }
      }

      // 2. Claim Umpire Invite (Handle promotion for standard users)
      if (umpireInvite) {
        const inviteGame = await HostedGame.findOne({ "customUmpire.inviteToken": umpireInvite });
        if (inviteGame) {
          let targetOwner = owner;

          if (!owner) {
            // Promote standard user to limited umpire
            user.role = "LIMITED_UMPIRE";
            await user.save();

            targetOwner = new Owner({
              userId: user._id,
              name: user.name,
              email: user.email,
              googleId: user.googleId,
              role: "LIMITED_UMPIRE",
              walletBalance: 0
            });
            await targetOwner.save();
            user.ownerDetails = targetOwner._id;
            await user.save();
            owner = targetOwner;
          }

          // Link match regardless of if owner already existed
          await HostedGame.findOneAndUpdate(
            { "customUmpire.inviteToken": umpireInvite },
            { 
              umpire: targetOwner._id, 
              "customUmpire.inviteStatus": "ACCEPTED" 
            },
            { new: true }
          );

          // Update credentials for the response
          roleToReturn = "LIMITED_UMPIRE"; 
          token = generateOwnerToken(user?._id || owner.userId, roleToReturn, targetOwner._id);
        }
      }
    }

    await issueTokens(res, authAccount ? authAccount._id : (user ? user._id : owner.userId || owner._id), token);

    const authAccount = owner || user;
    if (authAccount && authAccount.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator." });
    }

    // Check if user is missing essential details or has no password set
    const isNewUser = !authAccount.phone || !authAccount.gender || !authAccount.location || !authAccount.password;

    return res.status(200).json({ 
      success: true, 
      message: "Google authentication successful", 
      token, 
      role: roleToReturn,
      user: authAccount,
      isNewUser
    });
  } catch (error) {
    console.error(chalk.red("Google Auth Error:"), error);
    return res.status(400).json({ success: false, message: "Google authentication failed" });
  }
};

// Logout
export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await RefreshToken.findOneAndUpdate(
          { token: hashedToken },
          { revokedAt: new Date() }
      );
  }
  
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const refresh = async (req, res) => {
  try {
      const refreshToken = req.cookies?.refresh_token;
      
      if (!refreshToken) {
          return res.status(401).json({ success: false, message: "No refresh token provided" });
      }

      let decoded;
      try {
          decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      } catch (err) {
          return res.status(401).json({ success: false, message: "Invalid refresh token" });
      }

      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const tokenDoc = await RefreshToken.findOne({ token: hashedToken, user: decoded.id });

      if (!tokenDoc || !tokenDoc.isActive) {
          return res.status(401).json({ success: false, message: "Refresh token revoked or expired" });
      }

      const user = await User.findById(decoded.id);
      const owner = await Owner.findOne({ userId: decoded.id });

      if (!user && !owner) {
          return res.status(401).json({ success: false, message: "User not found" });
      }
      
      if ((user && user.status === "blocked") || (owner && owner.status === "blocked")) {
          return res.status(403).json({ success: false, message: "Account blocked" });
      }

      let role = "user";
      let newToken;
      let account = owner || user;
      
      if (owner) {
          role = owner.role;
          newToken = generateOwnerToken(owner.userId || owner._id, role, owner._id);
      } else {
          newToken = generateUserToken(user._id, user.role, user.ownerDetails);
      }

      tokenDoc.revokedAt = new Date();
      await tokenDoc.save();

      await issueTokens(res, decoded.id, newToken);

      return res.status(200).json({ 
          success: true, 
          token: newToken,
          role,
          user: account
      });
  } catch (error) {
      console.error("Refresh token error:", error);
      return res.status(500).json({ success: false, message: "Failed to refresh token" });
  }
};

// Owner Request (Waitlist/Inquiry)
export const ownerRequest = async (req, res) => {
  const { name, email, phone, role, businessDetails, documents } = req.body;
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
      role: role || "venu_owners",
      businessDetails,
      documents
    });
    await newOwnerRequest.save();

    // Notify Admin
    await notifyAdmins({
      title: "New Partner Inquiry",
      message: `New request from ${name} for role: ${role || "venu_owners"}`,
      type: "SYSTEM",
      link: "/admin/partners"
    });

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
  const { name, email, phone, role, portfolioUrl } = req.body;
  const userId = req.user?.id;

  try {
    console.log(`[UPGRADE_START] Request from ${email} for role ${role}`);

    // 1. Parse businessDetails if it's a string (from FormData)
    let businessDetails = req.body.businessDetails;
    if (typeof businessDetails === "string") {
      try {
        businessDetails = JSON.parse(businessDetails);
      } catch (e) {
        console.error("[UPGRADE] Failed to parse businessDetails", e);
        // If it's a string and fails to parse, we should still try to handle it or throw a better error
      }
    }

    // 2. Check if user already has a professional role
    if (email) {
      const ownerAccount = await Owner.findOne({ email: email.toLowerCase() });
      if (ownerAccount) {
        return res.status(400).json({ 
          success: false, 
          message: `Account already has a professional role (${ownerAccount.role}).` 
        });
      }
    } else {
      return res.status(400).json({ success: false, message: "Email is required for verification." });
    }

    // 3. Check for existing requests
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

      if (existingRequest.status === "rejected") {
        await OwnerRequest.deleteOne({ _id: existingRequest._id });
      }
    }

    // 4. Handle File Uploads
    const documents = [];
    
    console.log("[UPGRADE] User ID:", userId);
    console.log("[UPGRADE] Request Files:", req.files ? `Count: ${req.files.length}` : "NONE");
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToCloudinary(file.buffer, "kridaz/verification");
          documents.push({
            name: file.originalname,
            url: url
          });
        } catch (uploadErr) {
          console.error(`[UPGRADE] Error uploading ${file.originalname}:`, uploadErr);
        }
      }
    }

    // 5. Create new request
    const newRequest = new OwnerRequest({
      userId,
      name,
      email: email.toLowerCase(),
      phone,
      role: role || "venu_owners",
      businessDetails,
      documents,
      portfolioUrl,
      status: "pending",
    });

    await newRequest.save();

    // 6. Notify Admin
    try {
      await notifyAdmins({
        title: "Role Upgrade Request",
        message: `User ${name} requested upgrade to ${role || "venu_owners"}`,
        type: "SYSTEM",
        link: "/admin/partners"
      });
    } catch (notifyErr) {
      console.error("[UPGRADE] Notification error (non-fatal):", notifyErr);
    }
    
    return res.status(201).json({
      success: true,
      message: "Your application has been submitted and is under review. Our team will verify your documents shortly.",
    });
  } catch (err) {
    console.error(chalk.red("Upgrade Request Error:"), err);
    
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
    let applicationStatus = null;
    let applicationRole = null;

    if (role === "user") {
      account = await User.findById(id).select("-password").lean();
      if (account) {
        // Recover the true role for users whose role was missing from userSchema previously
        const ownerAccount = await Owner.findOne({ userId: id }).select("-password").lean();
        if (ownerAccount) {
          account.role = ownerAccount.role;
        } else {
          // Query by userId (most reliable) and get any active application
          const existingRequest = await OwnerRequest.findOne({ userId: id })
            .sort({ createdAt: -1 }) // get the most recent application
            .lean();

          if (existingRequest && existingRequest.status !== "rejected") {
            applicationStatus = existingRequest.status;   // "pending" | "approved"
            applicationRole = existingRequest.role;       // "owner" | "coach" | "umpire"
          }
        }
      }
    } else {
      account = await Owner.findById(id).select("-password").lean();
      if (!account) {
        account = await Owner.findOne({ userId: id }).select("-password").lean();
      }
    }

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Attach application info to account object if it exists
    if (applicationStatus) {
      account.applicationStatus = applicationStatus;
      account.applicationRole = applicationRole;
    }

    if (account.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator." });
    }

    const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1];

    return res.status(200).json({ 
      success: true, 
      user: account, 
      role: account.role || role,
      token
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

    const { id, role, ownerId } = decoded;
    
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `kridaz/profiles/${role}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let account;
    // Unified update: always update User document
    account = await User.findByIdAndUpdate(id, { profilePicture: uploadResult.secure_url }, { new: true });

    // For partners, sync with Owner document
    if (role !== "user") {
      const targetOwnerId = ownerId || (account && account.ownerDetails);
      if (targetOwnerId) {
        await Owner.findByIdAndUpdate(targetOwnerId, { profilePicture: uploadResult.secure_url });
      } else {
        await Owner.findOneAndUpdate({ userId: id }, { profilePicture: uploadResult.secure_url });
      }
    }

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    if (role !== "user") {
      // Return the updated Owner doc instead of User doc
      const targetOwnerId = ownerId || (account && account.ownerDetails);
      if (targetOwnerId) {
        account = await Owner.findById(targetOwnerId).select("-password").lean();
      } else {
        account = await Owner.findOne({ userId: id }).select("-password").lean();
      }
    }

    // Real-time update for profile changes
    const io = getIO();
    if (io) {
      io.emit("user profile updated", { userId: account._id, updatedUser: account });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: uploadResult.secure_url,
      user: account
    });
  } catch (err) {
    console.error(chalk.red("updateProfilePicture Error:"), err);
    return res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
};

export const updateInterests = async (req, res) => {
  const { sportTypes } = req.body;
  try {
    const { id, role, ownerId } = req.user;
    let account = await User.findByIdAndUpdate(id, { sportTypes }, { new: true });
    
    if (role !== "user") {
      const targetOwnerId = ownerId || (account && account.ownerDetails);
      const ownerUpdate = { interests: sportTypes, gameTypes: sportTypes };
      if (targetOwnerId) {
        await Owner.findByIdAndUpdate(targetOwnerId, ownerUpdate);
      } else {
        await Owner.findOneAndUpdate({ userId: id }, ownerUpdate);
      }
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
  const { name, username, phone, bio, gender, city, state, location, sportTypes, interests, password } = req.body;
  try {
    const decoded = req.user || req.owner;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, role, ownerId } = decoded;

    // Check if username is taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: id } 
      });
      const existingOwner = await Owner.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existingUser || existingOwner) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
    }

    let account;
    const finalInterests = interests || sportTypes || [];
    let hashedPassword;
    if (password) {
      hashedPassword = await argon2.hash(password);
    }

    const updateData = {
      name,
      username: username?.toLowerCase(),
      phone,
      bio,
      gender,
      city,
      state,
      location,
      sportTypes: finalInterests,
      interests: finalInterests,
      ...(hashedPassword && { password: hashedPassword })
    };

    account = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
    
    if (role !== "user") {
      // Keep Owner in sync
      const targetOwnerId = ownerId || (account && account.ownerDetails);
      const ownerUpdate = { ...updateData };
      ownerUpdate.gameTypes = finalInterests;

      if (targetOwnerId) {
        await Owner.findByIdAndUpdate(targetOwnerId, ownerUpdate);
      } else {
        await Owner.findOneAndUpdate({ userId: id }, ownerUpdate);
      }
    }

    if (role !== "user") {
      // Return the updated Owner doc instead of User doc
      const targetOwnerId = ownerId || (account && account.ownerDetails);
      if (targetOwnerId) {
        account = await Owner.findById(targetOwnerId).select("-password").lean();
      } else {
        account = await Owner.findOne({ userId: id }).select("-password").lean();
      }
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

export const forgotPasswordOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    const existingOwner = await Owner.findOne({ email });

    if (!existingUser && !existingOwner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndDelete({ email });
    const newOtp = new OTP({ email, emailOtp, phone: '0000000000', phoneOtp: '000000' });
    await newOtp.save();

    await generateEmail(
      email,
      'Your Password Reset Code',
      `<p>Your password reset code is <strong>${emailOtp}</strong>. It will expire in 10 minutes.</p>`
    );

    return res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord || otpRecord.emailOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await argon2.hash(newPassword);

    const user = await User.findOne({ email });
    const owner = await Owner.findOne({ email });

    if (!user && !owner) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (user) {
      user.password = hashedPassword;
      await user.save();
    }

    if (owner) {
      owner.password = hashedPassword;
      await owner.save();
    }

    await OTP.findOneAndDelete({ email });

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
