import verifyAuth from "./jwt/auth.middleware.js";

/**
 * Authentication middleware (Alias for verifyAuth)
 * Used in many routes to protect endpoints
 */
export const authenticate = verifyAuth;

/**
 * Protect middleware (Alias for verifyAuth)
 * Used in auth routes
 */
export const protect = verifyAuth;

export default verifyAuth;
