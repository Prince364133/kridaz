import crypto from "crypto";

/**
 * Generates a unique short ID for matches
 * Format: KRZ-XXXX (e.g., KRZ-A92B)
 */
export const generateShortId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return `KRZ-${result}`;
};
