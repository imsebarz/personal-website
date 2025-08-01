/**
 * Date utilities optimized for Colombia timezone (UTC-5)
 * Handles timezone differences between local development and Vercel production
 */

/**
 * Gets the current date in Colombia timezone (UTC-5)
 */
export function getCurrentDateInColombia(): Date {
  const now = new Date();
  // Colombia is UTC-5 (no daylight saving time)
  const colombiaOffset = -5 * 60; // -5 hours in minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const colombiaTime = new Date(utcTime + (colombiaOffset * 60000));
  return colombiaTime;
}

/**
 * Gets the next date in Colombia timezone (UTC-5)
 */
export function getNextDateInColombia(): Date {
  const colombiaToday = getCurrentDateInColombia();
  const colombiaTomorrow = new Date(colombiaToday);
  colombiaTomorrow.setDate(colombiaTomorrow.getDate() + 1);
  return colombiaTomorrow;
}

/**
 * Gets day name in Spanish for a given date
 */
export function getDayName(date: Date): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[date.getDay()];
}

/**
 * Gets current day name in Colombia timezone
 */
export function getCurrentDayNameInColombia(): string {
  const colombiaDate = getCurrentDateInColombia();
  return getDayName(colombiaDate);
}

/**
 * Gets next day name in Colombia timezone
 */
export function getNextDayNameInColombia(): string {
  const colombiaTomorrow = getNextDateInColombia();
  return getDayName(colombiaTomorrow);
}

/**
 * Gets formatted date string for Colombia timezone
 */
export function getFormattedDateInColombia(date?: Date): string {
  const targetDate = date || getCurrentDateInColombia();
  return targetDate.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
