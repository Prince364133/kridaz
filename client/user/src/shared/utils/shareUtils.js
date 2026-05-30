import { Capacitor } from '@capacitor/core';

/**
 * Normalizes URL origins for sharing to ensure native mobile platforms (localhost) 
 * generate clean production domain URLs (https://kridaz.vercel.app) instead of internal localhost schemas.
 * 
 * @param {string} localUrl - Standard window.location.href or local path URL
 * @returns {string} Fully qualified production share link
 */
export const getShareLink = (localUrl) => {
  const prodBase = import.meta.env.VITE_USER_URL || 'https://kridaz.vercel.app';
  
  if (!localUrl) return prodBase;

  // If inside native Android/iOS context or using localhost schema
  if (Capacitor.isNativePlatform() || localUrl.includes('localhost') || localUrl.startsWith('http://localhost') || localUrl.startsWith('https://localhost')) {
    try {
      const parsed = new URL(localUrl);
      return `${prodBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (e) {
      // Fallback in case of string parsing failures
      if (localUrl.startsWith('/')) {
        return `${prodBase}${localUrl}`;
      }
      return `${prodBase}/${localUrl}`;
    }
  }
  
  return localUrl;
};
