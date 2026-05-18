import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";

/**
 * Generates a short-lived (15m) JWT access token for Users.
 */
export function generateUserToken(userId, role = "user", ownerId = null) {
    return jwt.sign({ 
        id: userId, 
        role: role,
        ownerId: ownerId 
    }, process.env.JWT_SECRET, {
         expiresIn: "15m"
    });
}

/**
 * Generates a short-lived (15m) JWT access token for Owners.
 */
export const generateOwnerToken = (userId, role, ownerId) => {
    return jwt.sign({ 
        id: userId, 
        ownerId: ownerId, 
        role: role || "owner" 
    }, process.env.JWT_SECRET, {
        expiresIn: "15m"
    });
}

/**
 * Generates a non-JWT secure random refresh token, hashes it, and saves to DB.
 * Returns the plaintext token for the client (to be stored in HttpOnly cookie).
 * 
 * We use SHA-256 for storage to allow fast indexed lookups while keeping the 
 * plaintext token out of the database.
 */
export const generateRefreshToken = async (userId, ipAddress = null) => {
    // Generate a secure random string (40 bytes = 80 chars hex)
    const token = crypto.randomBytes(40).toString('hex');
    
    // Hash the token for storage (SHA-256 is sufficient for lookup of high-entropy strings)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Set expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Save to database
    await prisma.refreshToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
            createdByIp: ipAddress
        }
    });
    
    return token;
}