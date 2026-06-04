import { fromZonedTime } from "date-fns-tz";
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

  // Parse the time components from the original time string
  const originalTime = parseISO(timeString);
  const hours = originalTime.getHours();
  const minutes = originalTime.getMinutes();

  // Parse the selected date
  const turfDate = parseISO(selectedTurfDate);

  // Create a new date object in the target timezone with the specified date and time
  const combinedLocalTime = new Date(
    turfDate.getFullYear(),
    turfDate.getMonth(),
    turfDate.getDate(),
    hours,
    minutes
  );

  // Convert this local time to UTC for database storage
  return fromZonedTime(combinedLocalTime, timeZone);
}

export default adjustTime;
