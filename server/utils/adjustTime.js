import { toZonedTime, fromZonedTime, format } from "date-fns-tz";
import { parseISO } from "date-fns";

/**
 * Converts a UTC ISO time string to the application timezone,
 * then sets its calendar date to match selectedTurfDate.
 *
 * @param {string} timeString       - ISO 8601 time string (UTC)
 * @param {string} selectedTurfDate - ISO 8601 date string (YYYY-MM-DD)
 * @returns {Date} - Date object with adjusted time and date
 */
function adjustTime(timeString, selectedTurfDate) {
  const timeZone = process.env.TIMEZONE || "Asia/Kolkata";

  // Convert UTC time to the local timezone
  const originalTime = parseISO(timeString);
  const zonedTime = toZonedTime(originalTime, timeZone);

  // Parse the selected date in the same timezone
  const turfDate = parseISO(selectedTurfDate);
  const zonedDate = toZonedTime(turfDate, timeZone);

  // Override the date components while keeping the time components
  zonedTime.setFullYear(zonedDate.getFullYear());
  zonedTime.setMonth(zonedDate.getMonth());
  zonedTime.setDate(zonedDate.getDate());

  return zonedTime;
}

export default adjustTime;
