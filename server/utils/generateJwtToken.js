import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { getAccessSecret } from "./jwtSecrets.js";

/**
<<<<<<< Updated upstream
 * Generates a short-lived (15m) JWT access token for Users.
 *
 * `tokenVersion` is embedded so a future PR can mass-invalidate sessions on
 * password change by bumping User.tokenVersion and rejecting tokens whose
 * embedded version doesn't match. Today the field is plumbed but verifiers
 * don't enforce it — adding enforcement is a single-file change.
 */
export function generateUserToken(userId, role = "user", ownerId = null, tokenVersion = 0) {
=======
 * Look up the current tokenVersion so newly issued tokens can embed it.
 * Returns 0 (the default) for users without the field — safe fallback.
 */
const fetchTokenVersion = async (userId) => {
    if (!userId) return 0;
    try {
        const row = await prisma.user.findUnique({
            where: { id: userId },
            select: { tokenVersion: true },
        });
        return row?.tokenVersion ?? 0;
    } catch {
        return 0;
    }
};

/**
 * Generates a short-lived (15m) JWT access token for Users.
 *
 * Embeds `tv` = the user's current tokenVersion so that a future bump (via
 * /logout-all or a password reset) can invalidate every token issued before.
 * Callers that don't await this still work — the field is just optional.
 */
export async function generateUserToken(userId, role = "user", ownerId = null) {
    const tv = await fetchTokenVersion(userId);
>>>>>>> Stashed changes
    return jwt.sign({
        id: userId,
        role: role,
        ownerId: ownerId,
<<<<<<< Updated upstream
        tokenVersion,
    }, getAccessSecret(), {
=======
        tv,
    }, process.env.JWT_SECRET, {
>>>>>>> Stashed changes
         expiresIn: "15m"
    });
}

/**
 * Generates a short-lived (15m) JWT access token for Owners.
 */
<<<<<<< Updated upstream
export const generateOwnerToken = (userId, role, ownerId, tokenVersion = 0) => {
=======
export const generateOwnerToken = async (userId, role, ownerId) => {
    const tv = await fetchTokenVersion(userId);
>>>>>>> Stashed changes
    return jwt.sign({
        id: userId,
        ownerId: ownerId,
        role: role || "owner",
<<<<<<< Updated upstream
        tokenVersion,
    }, getAccessSecret(), {
=======
        tv,
    }, process.env.JWT_SECRET, {
>>>>>>> Stashed changes
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