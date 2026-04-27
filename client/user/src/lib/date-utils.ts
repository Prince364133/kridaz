import { format, isValid } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';

/**
 * Safely formats a date string or Date object.
 * Returns a fallback string if the date is invalid.
 * 
 * @param date - The date to format (string or Date object)
 * @param formatStr - The date-fns format string (default: 'PPP')
 * @param fallback - The string to return if date is invalid (default: 'Invalid Date')
 */
export const safeFormat = (
  date: string | Date | null | undefined,
  formatStr: string = 'PPP',
  fallback: string = 'N/A'
): string => {
  if (!date) return fallback;

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (!isValid(d)) {
      return fallback;
    }

    return format(d, formatStr);
  } catch (error) {
    console.warn(`Error formatting date: ${date}`, error);
    return fallback;
  }
};

/**
 * Safely formats a date relative to now (e.g., "2 days ago").
 * 
 * @param date - The date to format
 * @param fallback - Fallback string
 */
export const safeFormatDistanceToNow = ( 
  date: string | Date | null | undefined, 
  options?: { addSuffix?: boolean },
  fallback: string = 'N/A'
): string => {
  if (!date) return fallback;

  try {
     const d = typeof date === 'string' ? new Date(date) : date;
     if (!isValid(d)) return fallback;
     return formatDistanceToNow(d, options);
  } catch (_) {
    return fallback;
  }
}
