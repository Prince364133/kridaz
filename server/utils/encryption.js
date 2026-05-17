import crypto from 'crypto';
import logger from './logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const SALT = 'kridaz-encryption-salt'; // Fixed salt for key derivation

/**
 * Derives a 32-byte key from the encryption secret
 * @returns {Buffer}
 */
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is not defined in environment variables');
  }
  // Using scrypt for robust key derivation
  return crypto.scryptSync(secret, SALT, 32);
};

/**
 * Encrypts plaintext using AES-256-GCM
 * @param {string} text 
 * @returns {string} iv:authTag:encryptedText (hex)
 */
export const encrypt = (text) => {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption failed', error);
    return text; // Fallback to plaintext if encryption fails to prevent data loss, though should be avoided in prod
  }
};

/**
 * Decrypts hex string back to plaintext
 * @param {string} encryptedText iv:authTag:encryptedText
 * @returns {string} plaintext
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // Not in encrypted format, return as is (could be plaintext)
    return encryptedText;
  }

  try {
    const [ivHex, authTagHex, contentHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails (e.g. wrong key), return original text
    // In production, you might want to log this as a security event
    logger.error('Decryption failed', error);
    return encryptedText;
  }
};

/**
 * Helper to identify if a string is in the encrypted format
 * @param {string} text 
 * @returns {boolean}
 */
export const isEncrypted = (text) => {
  if (!text || typeof text !== 'string') return false;
  const parts = text.split(':');
  return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
};
