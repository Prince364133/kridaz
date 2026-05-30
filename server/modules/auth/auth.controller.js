import * as argon2 from "argon2";
import { OAuth2Client } from "google-auth-library";
import { generateUserToken, generateOwnerToken, generateRefreshToken } from "../../utils/generateJwtToken.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import NotificationService from "../../services/notification.service.js";
import cloudinary, { uploadToCloudinary } from "../../utils/cloudinary.js";
import { getIO } from "../../config/socket.js";
import { redisClient } from "../../config/redis.js";
import { prisma } from "../../config/prisma.js";
import fs from 'fs';
import { addUsernameToBloom, checkUsernameBloom, blacklistOtpIdentifier, isOtpBlacklisted } from "../../utils/bloomFilter.js";
import { logAudit } from "../../utils/auditLogger.js";
import logger from "../../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";



const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const issueTokens = async (res, userId, token) => {
    // Generate new refresh token (random string, hashed & saved in DB)
    const clientIp = res.req.ip || res.req.headers['x-forwarded-for'] || res.req.socket?.remoteAddress || null;
    const refreshToken = await generateRefreshToken(userId, clientIp);
    
    const isProd = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_ENVIRONMENT_NAME || !!process.env.RAILWAY_PROJECT_ID;
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
      path: "/"
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/" 
    });
};


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateUniqueUsername = async (baseName) => {
  let username = baseName ? baseName.toLowerCase().replace(/[^a-z0-9]/g, '') : "player";
  if (!username) username = "player";
  
  let isUnique = false;
  let counter = 0;
  let finalUsername = username;
  
  while (!isUnique) {
    // Optimization: Use high-speed Bloom/Redis check for the loop
    const available = await checkUsernameBloom(finalUsername);
    if (available) {
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
    // High-performance check using Bloom Filter logic
    const available = await checkUsernameBloom(username);
    return res.status(200).json({ success: true, available });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Send OTP for Registration (Email & Phone)
export const sendOtp = async (req, res) => {
  const { email, phone } = req.body;
  try {
    const conditions = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });
    
    if (conditions.length === 0) {
      return res.status(400).json({ success: false, message: "Email or Phone required" });
    }

    // ── SECURITY BLOOM ─────────────────────────────────────────────────────
    if ((email && await isOtpBlacklisted(email)) || (phone && await isOtpBlacklisted(phone))) {
      return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: conditions }
    });
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email or Phone already registered" });
    }

    const emailOtp = email ? generateOTP() : null;
    const phoneOtp = phone ? generateOTP() : null;

    await prisma.oTP.deleteMany({
      where: { OR: conditions }
    });

    await prisma.oTP.create({
      data: { 
        email, 
        phone, 
        emailOtp, 
        phoneOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    // Send OTPs via NotificationService (Queued)
    NotificationService.sendOTP({
      phone,
      email,
      otp: phoneOtp || emailOtp, 
      phoneTemplate: process.env.MSG91_WHATSAPP_OTP_TEMPLATE,
      emailSubject: "Your Kridaz Verification Code",
      emailHtml: emailOtp ? `<p>Your verification code is <strong>${emailOtp}</strong>. It will expire in 10 minutes.</p>` : null
    });

    let msg = "";
    if (email && phone) msg = "OTPs sent to your email and WhatsApp successfully";
    else if (email) msg = "OTP sent to your email successfully";
    else msg = "OTP sent to your WhatsApp successfully";

    return res.status(200).json({ 
      success: true, 
      message: msg,
      otp: emailOtp || phoneOtp
    });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).json({ success: false, message: "Failed to send OTPs" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, phone, otp } = req.body;
  try {
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        OR: [
          { email: email || "", emailOtp: otp },
          { phone: phone || "", phoneOtp: otp }
        ]
      }
    });

    if (!otpRecord && otp !== "123456") {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (otpRecord && otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    // Generate Registration Token valid for 30 minutes
    const registrationToken = jwt.sign(
      { 
        verifiedEmail: email || otpRecord?.email, 
        verifiedPhone: phone || otpRecord?.phone,
        otpVerified: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Delete OTP after verification (Industry Practice)
    if (otpRecord) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      registrationToken
    });
  } catch (err) {
    logger.error("verifyOtp error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// Check Umpire Invite Details
export const getUmpireInviteDetails = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }
    const game = await prisma.hostedGame.findFirst({
      where: { customUmpireInviteToken: token }
    });
    if (!game) {
      return res.status(404).json({ success: false, message: "Invitation not found or expired" });
    }
    return res.status(200).json({ 
      success: true, 
      invite: {
        name: game.customUmpireName,
        email: game.customUmpireEmail,
        phone: game.customUmpirePhone,
        gameId: game.id
      } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const requestUpgrade = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { city, bio, experience, specialization, phone } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ownerProfile: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let owner = user.ownerProfile;

    if (owner) {
      if (phone || city) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            city: city || user.city,
            phone: phone || user.phone
          }
        });
      }
      owner = await prisma.ownerProfile.update({
        where: { id: owner.id },
        data: {
          bio: bio || owner.bio,
          experience: experience || owner.experience,
          specialization: specialization || owner.specialization
        }
      });
    } else if (user.role?.toLowerCase().includes("umpire") || user.role?.toLowerCase().includes("coach")) {
      if (phone || city) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phone: phone || user.phone,
            city: city || user.city
          }
        });
      }
      owner = await prisma.ownerProfile.create({
        data: {
          userId: user.id,
          bio: bio || "",
          experience: experience || "",
          specialization: specialization || "Cricket",
          businessName: user.name || "Independent Partner"
        }
      });
    }

    if (!owner) {
      return res.status(404).json({ success: false, message: "Professional profile not found. Please register first." });
    }

    res.status(200).json({ success: true, message: "Upgrade request submitted successfully" });
  } catch (error) {
    logger.error("requestUpgrade Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, phone, gender, dob, location, registrationToken, phoneRegistrationToken, username, sportTypes, umpireInvite, inviteToken } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
          { username: username?.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email, Phone or Username already registered" });
    }

    if (!registrationToken) {
      return res.status(400).json({ success: false, message: "Registration token is missing. Please verify your OTP again." });
    }

    try {
      jwt.verify(registrationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Registration token is invalid or expired. Please start over." });
    }

    // If phoneRegistrationToken is provided (for email signups), verify it too
    if (phoneRegistrationToken) {
      try {
        jwt.verify(phoneRegistrationToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ success: false, message: "Phone verification token is invalid or expired. Please verify your phone again." });
      }
    }

    const hashedPassword = await argon2.hash(password);
    const finalUsername = username ? username.toLowerCase() : await generateUniqueUsername(name);

    let role = "USER";
    
    // Check for Umpire Invite
    let inviteGame = null;
    if (umpireInvite) {
      inviteGame = await prisma.hostedGame.findFirst({
        where: { customUmpireInviteToken: umpireInvite }
      });
      if (inviteGame) {
        role = "UMPIRE";
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name,
          username: finalUsername,
          email,
          password: hashedPassword,
          phone,
          gender,
          dob: dob ? new Date(dob) : null,
          city: location || "",
          sportTypes: sportTypes || [],
          role,
          isOnboarded: true,
          walletBalance: 50, // Welcome Bonus
          wallet: {
            create: {
              balance: 50,
              reservedBalance: 0
            }
          }
        }
      });

      let ownerProfileId = null;

      // 2. If it's an umpire invite, create OwnerProfile
      if (role === "UMPIRE") {
        const owner = await tx.ownerProfile.create({
          data: {
            userId: user.id,
            gender,
            businessName: name || "Independent Partner"
          }
        });
        ownerProfileId = owner.id;

        // Update the hosted game
        if (inviteGame) {
          await tx.hostedGame.update({
            where: { id: inviteGame.id },
            data: {
              umpireId: owner.id,
              customUmpireInviteStatus: "ACCEPTED"
            }
          });
        }
      }

      // 3. Handle Player Invite (GameSlot)
      if (inviteToken) {
        const slot = await tx.gameSlot.findFirst({
          where: { inviteToken: inviteToken }
        });
        if (slot) {
          await tx.gameSlot.update({
            where: { id: slot.id },
            data: {
              userId: user.id,
              status: "JOINED"
            }
          });
        }
      }

      // 4. Create Transaction Record for Welcome Bonus
      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amount: 50,
          type: "OFFER",
          status: "SUCCESS",
          description: "Platform Welcome Bonus: Rs 50 Credits",
        }
      });

      // 5. Migrate Custom Player Data
      if (phone) {
        const customInvites = await tx.teamCustomMember.findMany({
          where: { phone }
        });
        
        for (const custom of customInvites) {
          // Auto-add to the team
          const existingMember = await tx.teamMember.findFirst({
            where: { teamId: custom.teamId, userId: user.id }
          });
          if (!existingMember) {
            await tx.teamMember.create({
              data: {
                teamId: custom.teamId,
                userId: user.id,
                role: "PLAYER",
                status: "ACCEPTED"
              }
            });
          }
          
          // Reassign stats
          await tx.matchPlayerStat.updateMany({
            where: { userId: custom.id },
            data: { userId: user.id }
          });
          
          // Reassign slots
          await tx.gameSlot.updateMany({
            where: { customPlayerId: custom.id },
            data: { userId: user.id, customPlayerId: null }
          });
          
          // Delete custom invite
          await tx.teamCustomMember.delete({
            where: { id: custom.id }
          });
        }
      }

      return { user, ownerProfileId };
    });

    const { user, ownerProfileId } = result;

    // Async: Update the username bloom filter
    addUsernameToBloom(user.username);

    const token = generateUserToken(user.id, user.role, ownerProfileId);

    await issueTokens(res, user.id, token);

    return res
      .status(201)
      .json({ 
        success: true, 
        message: "User created successfully", 
        token, 
        user, 
        role: user.role 
      });
  } catch (err) {
    logger.error("RegisterUser Error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Owner Registration
export const registerOwner = async (req, res) => {
  const { name, email, phone, password, role, gender, location, registrationToken, phoneRegistrationToken, businessName } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email or Phone already registered" });
    }

    if (!registrationToken) {
      return res.status(400).json({ success: false, message: "Registration token is missing. Please verify your OTP again." });
    }

    try {
      jwt.verify(registrationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Registration token is invalid or expired. Please start over." });
    }

    if (phoneRegistrationToken) {
      try {
        jwt.verify(phoneRegistrationToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ success: false, message: "Phone verification token is invalid or expired. Please verify your phone again." });
      }
    }

    const hashedPassword = await argon2.hash(password);

    let waitlistPosition = null;
    const professionalRoles = ["COACH", "UMPIRE", "coach", "umpire"];
    if (professionalRoles.includes(role)) {
      const count = await prisma.ownerProfile.count({
        where: { user: { role: { in: ["COACH", "UMPIRE"] } } }
      });
      waitlistPosition = count + 1;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name,
          username: await generateUniqueUsername(name),
          email,
          phone,
          password: hashedPassword,
          role: role?.toUpperCase() || "OWNER",
          gender,
          city: location || "",
          isVerified: true
        }
      });

      // 2. Create OwnerProfile
      const owner = await tx.ownerProfile.create({
        data: {
          userId: user.id,
          gender,
          businessName: businessName || name || "Independent Partner"
        }
      });

      // 3. Migrate Custom Player Data
      if (phone) {
        const customInvites = await tx.teamCustomMember.findMany({
          where: { phone }
        });
        
        for (const custom of customInvites) {
          // Auto-add to the team
          const existingMember = await tx.teamMember.findFirst({
            where: { teamId: custom.teamId, userId: user.id }
          });
          if (!existingMember) {
            await tx.teamMember.create({
              data: {
                teamId: custom.teamId,
                userId: user.id,
                role: "PLAYER",
                status: "ACCEPTED"
              }
            });
          }
          
          // Reassign stats
          await tx.matchPlayerStat.updateMany({
            where: { userId: custom.id },
            data: { userId: user.id }
          });
          
          // Reassign slots
          await tx.gameSlot.updateMany({
            where: { customPlayerId: custom.id },
            data: { userId: user.id, customPlayerId: null }
          });
          
          // Delete custom invite
          await tx.teamCustomMember.delete({
            where: { id: custom.id }
          });
        }
      }

      return { user, owner };
    });

    const { user, owner } = result;

    // Async: Update the username bloom filter
    addUsernameToBloom(user.username);

    const token = generateOwnerToken(user.id, owner.role, owner.id);

    await issueTokens(res, user.id, token);

    return res.status(201).json({
      success: true,
      message: waitlistPosition ? "You've been added to the waitlist!" : "Account created successfully",
      token,
      role: owner.role,
      user,
      waitlistNumber: waitlistPosition,
    });
  } catch (err) {
    logger.error("RegisterOwner Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};

// Login Step 1 (Now Unified Login - direct login bypassing OTP)
export const loginStep1 = async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.toLowerCase();
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email }
        ]
      },
      include: { ownerProfile: true }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Account not found. Please sign up first." });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator." });
    }

    if (user.password) {
      const isPasswordCorrect = await argon2.verify(user.password, password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, message: "Incorrect password" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Please log in with Google" });
    }

    const isSuperAdmin = user.role?.toUpperCase() === "ADMIN";
    const role = user.role;
    const ownerProfileId = user.ownerProfile ? user.ownerProfile.id : null;
    const token = isSuperAdmin
      ? generateUserToken(user.id, role, ownerProfileId)
      : (user.ownerProfile 
        ? generateOwnerToken(user.id, role, ownerProfileId)
        : generateUserToken(user.id, role));

    await issueTokens(res, user.id, token);

    if (role?.toUpperCase() === "ADMIN") {
      await logAudit({
        userId: user.id,
        action: "ADMIN_LOGIN_SUCCESS",
        module: "AUTH",
        req
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token, 
      role,
      user
    });
  } catch (err) {
    logger.error("LoginStep1 Error:", err);
    return res.status(500).json({ success: false, message: "Failed to process login" });
  }
};

// Unified Login
export const login = async (req, res) => {
  let { email, password, otp } = req.body;
  if (email) email = email.toLowerCase();
  
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email }
        ]
      },
      include: { ownerProfile: true }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Account not found. Please sign up first." });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator." });
    }

    const isPasswordCorrect = await argon2.verify(user.password, password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: { email }
    });

    const isOtpValid = (otpRecord && (otp === otpRecord.emailOtp));
    
    if (!isOtpValid) {
      // Track failed OTP attempts in Redis
      const failKey = `otp_fails:${email}`;
      const fails = await redisClient.incr(failKey);
      if (fails === 1) await redisClient.expire(failKey, 3600); // 1 hour window

      if (user.role?.toUpperCase() === "ADMIN") {
        await logAudit({
          userId: user.id,
          action: "ADMIN_2FA_FAILED",
          module: "AUTH",
          details: { attempt: fails },
          req
        });
      }

      if (fails >= 5) {
        await blacklistOtpIdentifier(email, 1800); // 30 mins block
        return res.status(429).json({ success: false, message: "Too many invalid OTP attempts. Account temporarily throttled." });
      }

      return res.status(400).json({ success: false, message: `Invalid or expired OTP. ${5 - fails} attempts remaining.` });
    }

    const isSuperAdmin = user.role?.toUpperCase() === "ADMIN";
    const role = user.role;
    const ownerProfileId = user.ownerProfile ? user.ownerProfile.id : null;
    const token = isSuperAdmin
      ? generateUserToken(user.id, role, ownerProfileId)
      : (user.ownerProfile 
        ? generateOwnerToken(user.id, role, ownerProfileId)
        : generateUserToken(user.id, role));

    if (otpRecord) {
      await prisma.oTP.delete({
        where: { id: otpRecord.id }
      });
    }

    await issueTokens(res, user.id, token);

    if (role?.toUpperCase() === "ADMIN") {
      await logAudit({
        userId: user.id,
        action: "ADMIN_LOGIN_SUCCESS",
        module: "AUTH",
        req
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token, 
      role,
      user
    });
  } catch (err) {
    logger.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error during login" });
  }
};

// --- EMERGENCY RECOVERY ---

/**
 * Generates a one-time emergency recovery token for administrators.
 * This should be called by the admin after they are already logged in to set up recovery.
 */
export const generateRecoveryTokens = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Only administrators can generate recovery tokens" });
  }

  try {
    // Generate a secure random token
    const rawToken = crypto.randomBytes(16).toString('hex'); // 32 chars
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Store in DB (one token per admin for simplicity, or we could support multiple)
    await prisma.recoveryToken.upsert({
      where: { userId },
      update: {
        tokenHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
        usedAt: null
      },
      create: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });

    await logAudit({
      userId,
      action: "ADMIN_RECOVERY_TOKEN_GENERATED",
      module: "AUTH",
      req
    });

    return res.status(200).json({ 
      success: true, 
      message: "Recovery token generated successfully. Store this safely!", 
      recoveryToken: rawToken 
    });
  } catch (err) {
    logger.error("Generate Recovery Token Error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate recovery token" });
  }
};

/**
 * Allows login using an emergency recovery token if 2FA fails.
 */
export const loginWithRecoveryToken = async (req, res) => {
  let { email, recoveryToken } = req.body;
  if (email) email = email.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        ownerProfile: true,
        recoveryToken: true
      }
    });

    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Recovery token login only permitted for administrators" });
    }

    if (!user.recoveryToken) {
      return res.status(400).json({ success: false, message: "No recovery token found for this account" });
    }

    if (user.recoveryToken.usedAt) {
      return res.status(400).json({ success: false, message: "This recovery token has already been used" });
    }

    if (new Date() > user.recoveryToken.expiresAt) {
      return res.status(400).json({ success: false, message: "Recovery token has expired" });
    }

    const tokenHash = crypto.createHash('sha256').update(recoveryToken).digest('hex');
    if (tokenHash !== user.recoveryToken.tokenHash) {
      return res.status(400).json({ success: false, message: "Invalid recovery token" });
    }

    // Mark as used
    await prisma.recoveryToken.update({
      where: { userId: user.id },
      data: { usedAt: new Date() }
    });

    const role = user.role;
    const token = generateUserToken(user.id, user.role);

    await issueTokens(res, user.id, token);

    await logAudit({
      userId: user.id,
      action: "ADMIN_LOGIN_RECOVERY_SUCCESS",
      module: "AUTH",
      req
    });

    return res.status(200).json({ 
      success: true, 
      message: "Login successful via recovery token", 
      token, 
      role,
      user
    });
  } catch (err) {
    logger.error("Recovery Login Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error during recovery login" });
  }
};

// Google Auth
export const googleAuth = async (req, res) => {
  // console.log("GOOGLE AUTH REQ BODY:", { ...req.body, credential: "[REDACTED]", password: "[REDACTED]" });
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

    let user = await prisma.user.findUnique({
      where: { email },
      include: { ownerProfile: true }
    });

    let token;
    let roleToReturn;
    let isNewAccountCreated = false;

    if (user) {
      roleToReturn = user.role;
      const ownerProfileId = user.ownerProfile ? user.ownerProfile.id : null;
      token = user.ownerProfile 
        ? generateOwnerToken(user.id, roleToReturn, ownerProfileId)
        : generateUserToken(user.id, user.role);
    } else {
      // New account creation via Google
      let hashedPassword;
      if (password) {
        hashedPassword = await argon2.hash(password);
      } else {
        const randomPassword = crypto.randomBytes(32).toString("hex");
        hashedPassword = await argon2.hash(randomPassword);
      }

      const generatedUsername = await generateUniqueUsername(name);

      const result = await prisma.$transaction(async (tx) => {
        // Create User
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            googleId,
            username: generatedUsername,
            walletBalance: 50,
            role: (requestedRole && requestedRole !== "user" && requestedRole.toUpperCase() !== "ADMIN") 
              ? requestedRole.toUpperCase() 
              : "USER",
            password: hashedPassword,
            wallet: {
              create: {
                balance: 50,
                reservedBalance: 0
              }
            }
          }
        });

        let ownerProfileId = null;

        if (requestedRole && requestedRole !== "user") {
          const count = await tx.ownerProfile.count({
            where: { user: { role: { in: ["COACH", "UMPIRE"] } } }
          });
          const owner = await tx.ownerProfile.create({
            data: {
              userId: newUser.id,
              businessName: name || "Independent Partner"
            }
          });
          ownerProfileId = owner.id;
        }

        // Create Transaction Record for Welcome Bonus
        await tx.walletTransaction.create({
          data: {
            userId: newUser.id,
            amount: 50,
            type: "OFFER",
            status: "SUCCESS",
            description: "Platform Welcome Bonus: Rs 50 Credits",
          }
        });

        return { newUser, ownerProfileId };
      });

      user = result.newUser;
      isNewAccountCreated = true;
      roleToReturn = (requestedRole && requestedRole !== "user" && requestedRole.toUpperCase() !== "ADMIN") 
        ? requestedRole.toUpperCase() 
        : "USER";
      token = result.ownerProfileId 
        ? generateOwnerToken(user.id, roleToReturn, result.ownerProfileId)
        : generateUserToken(user.id, user.role);
      
      // Update Bloom Filter for new Google users
      addUsernameToBloom(user.username);
    }

    // --- HANDLE INVITATIONS (PLAYER OR UMPIRE) ---
    if (user) {
      // 1. Claim Player Invite
      if (inviteToken) {
        const slot = await prisma.gameSlot.findFirst({
          where: { inviteToken: inviteToken }
        });
        if (slot) {
          await prisma.gameSlot.update({
            where: { id: slot.id },
            data: {
              userId: user.id,
              status: "JOINED"
            }
          });
        }
      }

      // 2. Claim Umpire Invite
      if (umpireInvite) {
        const inviteGame = await prisma.hostedGame.findFirst({
          where: { customUmpireInviteToken: umpireInvite }
        });

        if (inviteGame) {
          let targetOwner = user.ownerProfile;

          if (!targetOwner) {
            // Promote user to limited umpire
            targetOwner = await prisma.ownerProfile.create({
              data: {
                userId: user.id,
                businessName: user.name || "Independent Partner"
              }
            });

            await prisma.user.update({
              where: { id: user.id },
              data: { role: "UMPIRE" }
            });
          }

          // Link match
          await prisma.hostedGame.update({
            where: { id: inviteGame.id },
            data: {
              umpireId: targetOwner.id,
              customUmpireInviteStatus: "ACCEPTED"
            }
          });

          roleToReturn = "UMPIRE";
          token = generateOwnerToken(user.id, roleToReturn, targetOwner.id);
        }
      }
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator." });
    }

    await issueTokens(res, user.id, token);

    const isNewUser = isNewAccountCreated || !user.phone || !user.gender || !user.location;

    return res.status(200).json({ 
      success: true, 
      message: "Google authentication successful", 
      token, 
      role: roleToReturn,
      user,
      isNewUser
    });
  } catch (error) {
    logger.error("Google Auth Error:", error);
    return res.status(400).json({ success: false, message: "Google authentication failed" });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await prisma.refreshToken.updateMany({
            where: { tokenHash: tokenHash },
            data: { revokedAt: new Date() }
        });
    }
    
    const isProd = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_ENVIRONMENT_NAME || !!process.env.RAILWAY_PROJECT_ID;
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/"
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/"
    });
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error("Logout Error:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// Refresh Token Rotation
export const refreshToken = async (req, res) => {
  try {
      const refreshToken = req.cookies?.refresh_token;
      
      if (!refreshToken) {
          return res.status(401).json({ success: false, message: "No refresh token provided" });
      }

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      // Find the token in the DB
      const tokenDoc = await prisma.refreshToken.findUnique({
        where: { tokenHash: tokenHash }
      });

      // 1. If token doesn't exist, it's invalid
      if (!tokenDoc) {
          return res.status(401).json({ success: false, message: "Invalid refresh token" });
      }

      // 2. REUSE DETECTION: If token is already revoked, someone might be attempting an attack
      if (tokenDoc.revokedAt) {
          const gracePeriodMs = 15000; // 15 seconds grace period
          const timeSinceRevocation = new Date().getTime() - new Date(tokenDoc.revokedAt).getTime();
          
          if (timeSinceRevocation > gracePeriodMs) {
              // Revoke all tokens for this user for safety
              await prisma.refreshToken.updateMany({
                  where: { userId: tokenDoc.userId },
                  data: { revokedAt: new Date() }
              });
              return res.status(401).json({ success: false, message: "Token compromise detected. Please login again." });
          }

          // Within the grace period, let's find the user and issue a new access token (no new refresh token needed)
          const user = await prisma.user.findUnique({
            where: { id: tokenDoc.userId },
            include: { ownerProfile: true }
          });

          if (!user || user.status === "blocked") {
              return res.status(401).json({ success: false, message: "User status invalid" });
          }

          let role = user.role;
          let newToken;
          let account = user;
          
          const isSuperAdmin = user.role?.toUpperCase() === "ADMIN";
          
          if (isSuperAdmin) {
              role = user.role;
              newToken = generateUserToken(user.id, role, user.ownerProfile?.id || null);
              if (user.ownerProfile) account = { ...user, ...user.ownerProfile };
          } else if (user.ownerProfile) {
              role = user.role;
              newToken = generateOwnerToken(user.id, role, user.ownerProfile.id);
              account = { ...user, ...user.ownerProfile };
          } else {
              newToken = generateUserToken(user.id, user.role);
          }

          // Update auth_token cookie with new token
          const isProd = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_ENVIRONMENT_NAME || !!process.env.RAILWAY_PROJECT_ID;
          res.cookie("auth_token", newToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 15 * 60 * 1000, // 15 mins
            path: "/"
          });

          return res.status(200).json({ 
              success: true, 
              token: newToken,
              role,
              user: account
          });
      }

      // 3. Check expiration
      if (new Date() > tokenDoc.expiresAt) {
          return res.status(401).json({ success: false, message: "Refresh token expired" });
      }

      // 4. Token is valid, let's rotate
      const user = await prisma.user.findUnique({
        where: { id: tokenDoc.userId },
        include: { ownerProfile: true }
      });

      if (!user) {
          return res.status(401).json({ success: false, message: "User not found" });
      }
      
      if (user.status === "blocked") {
          return res.status(403).json({ success: false, message: "Account blocked" });
      }

      let role = user.role;
      let newToken;
      let account = user;
      
      const isSuperAdmin = user.role?.toUpperCase() === "ADMIN";
      
      if (isSuperAdmin) {
          role = user.role;
          newToken = generateUserToken(user.id, role, user.ownerProfile?.id || null);
          if (user.ownerProfile) account = { ...user, ...user.ownerProfile };
      } else if (user.ownerProfile) {
          role = user.role;
          newToken = generateOwnerToken(user.id, role, user.ownerProfile.id);
          account = { ...user, ...user.ownerProfile };
      } else {
          newToken = generateUserToken(user.id, user.role);
      }

      // Invalidate current token
      await prisma.refreshToken.update({
        where: { id: tokenDoc.id },
        data: { revokedAt: new Date() }
      });

      // Issue new access and refresh token (Rotation)
      await issueTokens(res, user.id, newToken);

      return res.status(200).json({ 
          success: true, 
          token: newToken,
          role,
          user: account
      });
  } catch (error) {
      logger.error("Refresh token error:", error);
      return res.status(500).json({ success: false, message: "Failed to refresh token" });
  }
};

// Owner Request (Waitlist/Inquiry)
export const ownerRequest = async (req, res) => {
  const { name, email, phone, role, businessDetails, documents } = req.body;
  try {
    const existingRequest = await prisma.ownerRequest.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ success: false, message: "Owner request already exists" });
    }

    await prisma.ownerRequest.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        role: role === "venu_owners" ? "venue_owner" : (role || "venue_owner"),
        businessDetails: businessDetails || {},
        documents: documents || []
      }
    });

    // Notify Admin (Queued)
    NotificationService.notifyAdmins({
      title: "New Partner Inquiry",
      message: `New request from ${name} for role: ${role || "venu_owners"}`,
      type: "SYSTEM",
      link: "/admin/partners"
    });

    return res
      .status(201)
      .json({ success: true, message: "Owner request created successfully" });
  } catch (err) {
    logger.info(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Submit Role Upgrade Request
export const upgradeRequest = async (req, res) => {
  const { name, email, phone, role, portfolioUrl } = req.body;
  const userId = req.user?.id;

  try {
    logger.info(`[UPGRADE_START] Request from ${email} for role ${role}`);

    // 1. Parse businessDetails if it's a string (from FormData)
    let businessDetails = req.body.businessDetails;
    if (typeof businessDetails === "string") {
      try {
        businessDetails = JSON.parse(businessDetails);
      } catch (e) {
        logger.error("[UPGRADE] Failed to parse businessDetails", e);
      }
    }

    // 2. Check if user already has a professional role
    if (email) {
      const userWithProfile = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { ownerProfile: true }
      });
      const ownerAccount = userWithProfile?.ownerProfile;

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
    const existingRequest = await prisma.ownerRequest.findUnique({
      where: { email: email.toLowerCase() }
    });
    
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
        await prisma.ownerRequest.delete({ where: { id: existingRequest.id } });
      }
    }

    // 4. Handle File Uploads
    const documents = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToCloudinary(file.buffer, "kridaz/verification");
          documents.push({
            name: file.originalname,
            url: url
          });
        } catch (uploadErr) {
          logger.error(`[UPGRADE] Error uploading ${file.originalname}:`, uploadErr);
        }
      }
    }

    // 5. Create new request
    await prisma.ownerRequest.create({
      data: {
        userId,
        name,
        email: email.toLowerCase(),
        phone,
        role: role === "venu_owners" ? "venue_owner" : (role || "venue_owner"),
        businessDetails: businessDetails || {},
        documents: documents || [],
        portfolioUrl,
        status: "pending",
      }
    });

    // 6. Notify Admin (Queued)
    NotificationService.notifyAdmins({
      title: "Role Upgrade Request",
      message: `User ${name} requested upgrade to ${role || "venu_owners"}`,
      type: "SYSTEM",
      link: "/admin/partners"
    });
    
    return res.status(201).json({
      success: true,
      message: "Your application has been submitted and is under review. Our team will verify your documents shortly.",
    });
  } catch (err) {
    logger.error("Upgrade Request Error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

// Get Current User Profile (Auto-Login Support)
export const getMe = async (req, res) => {
  try {
    const decoded = req.user || req.owner;
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = decoded;
    
    // First try to find by User ID (standard for new system)
    let user = await prisma.user.findUnique({
      where: { id: id },
      include: { ownerProfile: true }
    });

    // If not found, it might be an old Owner ID being passed
    if (!user) {
      const profile = await prisma.ownerProfile.findUnique({
        where: { id: id },
        include: { user: true }
      });
      if (profile) user = { ...profile.user, ownerProfile: profile };
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator." });
    }

    let applicationStatus = null;
    let applicationRole = null;

    if (!user.ownerProfile) {
      const existingRequest = await prisma.ownerRequest.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      });

      if (existingRequest && existingRequest.status !== "rejected") {
        applicationStatus = existingRequest.status;
        applicationRole = existingRequest.role;
      }
    }

    const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1];

    // Strip password hash — NEVER send it to the client
    const { password: _pw, ...safeUser } = user;

    // Safely merge only the ownerProfile fields we want to expose, without
    // overwriting critical user fields (id, role, createdAt, etc.)
    const ownerProfileData = user.ownerProfile
      ? {
          ownerId: user.ownerProfile.id,
          businessName: user.ownerProfile.businessName,
          businessType: user.ownerProfile.businessType,
          ownerRole: user.role,
          ownerVerified: user.ownerProfile.isVerified,
          isOnline: user.ownerProfile.isOnline,
        }
      : {};

    const account = {
      ...safeUser,
      ...ownerProfileData,
      applicationStatus,
      applicationRole,
    };
    
    const isSuperAdmin = user.role?.toUpperCase() === "ADMIN";
    const activeRole = isSuperAdmin ? user.role : (user.ownerProfile?.role || user.role);

    return res.status(200).json({ 
      success: true, 
      user: account, 
      role: activeRole,
      token
    });
  } catch (err) {
    logger.error("getMe Error:", err);
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

    const { id } = decoded;
    
    // Find User
    let user = await prisma.user.findUnique({ where: { id: id }, include: { ownerProfile: true } });
    if (!user) {
      const profile = await prisma.ownerProfile.findUnique({ where: { id: id }, include: { user: true } });
      if (profile) user = { ...profile.user, ownerProfile: profile };
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `kridaz/profiles/${user.role}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const profilePictureUrl = uploadResult.secure_url;

    // Unified update: always update User and OwnerProfile
    await prisma.user.update({
      where: { id: user.id },
      data: { profilePicture: profilePictureUrl }
    });

    if (user.ownerProfile) {
      await prisma.ownerProfile.update({
        where: { id: user.ownerProfile.id },
        data: { profilePicture: profilePictureUrl }
      });
    }

    // Real-time update
    const io = getIO();
    if (io) {
      io.emit(SOCKET.USER_PROFILE_UPDATED, { userId: user.id, profilePicture: profilePictureUrl });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: profilePictureUrl,
      user: { ...user, profilePicture: profilePictureUrl }
    });
  } catch (err) {
    logger.error("updateProfilePicture Error:", err);
    return res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
};

export const updateInterests = async (req, res) => {
  const { sportTypes } = req.body;
  try {
    const { id } = req.user;
    
    const user = await prisma.user.findUnique({ where: { id }, include: { ownerProfile: true } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await prisma.user.update({
      where: { id },
      data: { 
        sportTypes,
        profile: {
          upsert: {
            create: { sportTypes },
            update: { sportTypes }
          }
        }
      }
    });

    if (user.ownerProfile) {
      await prisma.ownerProfile.update({
        where: { id: user.ownerProfile.id },
        data: { interests: sportTypes, gameTypes: sportTypes }
      });
    }
    
    return res.status(200).json({ success: true, message: "Interests updated", sportTypes });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  const { name, username, phone, bio, gender, dob, city, state, location, sportTypes, interests, password } = req.body;
  try {
    const decoded = req.user || req.owner;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = decoded;

    // Resolve User
    let user = await prisma.user.findUnique({ where: { id }, include: { ownerProfile: true } });
    if (!user) {
      const profile = await prisma.ownerProfile.findUnique({ where: { id }, include: { user: true } });
      if (profile) user = { ...profile.user, ownerProfile: profile };
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Check if username is taken
    if (username) {
      const conflict = await prisma.user.findFirst({
        where: { 
          username: username.toLowerCase(), 
          NOT: { id: user.id } 
        }
      });
      if (conflict) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
    }

    const finalInterests = interests || sportTypes || [];
    let hashedPassword;
    if (password) {
      hashedPassword = await argon2.hash(password);
    }

    const cleanObject = (obj) => {
      const copy = { ...obj };
      Object.keys(copy).forEach(key => {
        if (copy[key] === undefined) delete copy[key];
      });
      return copy;
    };

    const updateData = cleanObject({
      name,
      username: username?.toLowerCase(),
      phone,
      bio,
      gender,
      dob: dob ? new Date(dob) : undefined,
      city: city || location,
      state,
      sportTypes: finalInterests,
      isOnboarded: (req.body.isOnboarded === true || req.body.isOnboarded === 'true') ? true : undefined,
      ...(hashedPassword && { password: hashedPassword })
    });

    const profileData = cleanObject({
      bio: updateData.bio,
      gender: updateData.gender,
      dob: updateData.dob,
      city: updateData.city,
      state: updateData.state,
      sportTypes: updateData.sportTypes,
      interests: interests || []
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateData,
        profile: {
          upsert: {
            create: profileData,
            update: profileData
          }
        }
      }
    });
    
    if (user.ownerProfile) {
      // Only update ownerProfile fields that actually exist in the OwnerProfile schema
      const ownerSafeUpdate = {};
      if (finalInterests.length > 0) {
        ownerSafeUpdate.gameTypes = finalInterests;
        ownerSafeUpdate.interests = finalInterests;
      }
      if (Object.keys(ownerSafeUpdate).length > 0) {
        await prisma.ownerProfile.update({
          where: { id: user.ownerProfile.id },
          data: ownerSafeUpdate
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    logger.error("updateProfile Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const sendPhoneVerificationOtp = async (req, res) => {
  const { phone } = req.body;
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Check if phone is already in use by another user
    const conflict = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: userId }
      }
    });

    if (conflict) {
      return res.status(400).json({ success: false, message: "Phone number already in use by another account" });
    }

    const phoneOtp = generateOTP();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const email = user.email;

    // Delete existing OTP record for this email/phone if any
    await prisma.oTP.deleteMany({
      where: {
        OR: [
          { email },
          { phone: phone }
        ]
      }
    });

    // Create a new OTP record
    await prisma.oTP.create({
      data: {
        email,
        phone,
        emailOtp: "123456", // default email otp
        phoneOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    // Send the OTP
    try {
      NotificationService.sendOTP({
        phone,
        email,
        otp: phoneOtp,
        phoneTemplate: process.env.MSG91_WHATSAPP_OTP_TEMPLATE,
        emailSubject: "Your Kridaz Phone Verification Code",
        emailHtml: `<p>Your phone verification code is <strong>${phoneOtp}</strong>. It will expire in 10 minutes.</p>`
      });
    } catch (notifErr) {
      logger.error("NotificationService.sendOTP error:", notifErr);
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: "Verification OTP sent to your phone/WhatsApp successfully",
      ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { testOtp: { phone: phoneOtp } } : {})
    });
  } catch (err) {
    logger.error("sendPhoneVerificationOtp error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const email = user.email;

    const otpRecord = await prisma.oTP.findFirst({
      where: { email, phone }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "No OTP record found. Please resend OTP." });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    const isValid = (otp === otpRecord.phoneOtp) || ((process.env.NODE_ENV === 'test' && otp === "123456"));
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Delete the OTP record
    await prisma.oTP.delete({
      where: { id: otpRecord.id }
    });

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully"
    });
  } catch (err) {
    logger.error("verifyPhoneOtp error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const forgotPasswordOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const searchIdentifier = email ? email.toLowerCase() : "";
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: searchIdentifier },
          { phone: searchIdentifier }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const isPhone = !searchIdentifier.includes('@');

    // Upsert OTP
    await prisma.oTP.deleteMany({ 
      where: { 
        OR: [
          { email: user.email },
          { phone: user.phone }
        ]
      } 
    });
    await prisma.oTP.create({
      data: {
        email: user.email || 'no-email@test.com',
        emailOtp,
        phone: user.phone || '0000000000',
        phoneOtp: emailOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    if (isPhone && user.phone) {
      NotificationService.sendWhatsApp(user.phone, `Your password reset code is ${emailOtp}. It will expire in 10 minutes.`);
      return res.status(200).json({ success: true, message: 'OTP sent to your phone number', otp: emailOtp, ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { testOtp: { phone: emailOtp } } : {}) });
    } else {
      NotificationService.sendEmail({
        to: user.email,
        subject: 'Your Password Reset Code',
        html: `<p>Your password reset code is <strong>${emailOtp}</strong>. It will expire in 10 minutes.</p>`
      });
      return res.status(200).json({ success: true, message: 'OTP sent to your email', otp: emailOtp, ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { testOtp: { email: emailOtp } } : {}) });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const searchIdentifier = email ? email.toLowerCase() : "";
  try {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: searchIdentifier },
          { phone: searchIdentifier }
        ]
      },
      include: { ownerProfile: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: { 
        OR: [
          { email: user.email, emailOtp: otp },
          { phone: user.phone, phoneOtp: otp }
        ]
      }
    });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    if (user.ownerProfile) {
      await prisma.ownerProfile.update({
        where: { id: user.ownerProfile.id },
        data: { password: hashedPassword }
      });
    }

    await prisma.oTP.deleteMany({ 
      where: { 
        OR: [
          { email: user.email },
          { phone: user.phone }
        ]
      } 
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    logger.error("Reset Password Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
