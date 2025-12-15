import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { startOfDay, parseISO, addDays as dateFnsAddDays } from 'date-fns';

const TAIWAN_TZ = 'Asia/Taipei';

/**
 * Get current date in Taiwan timezone, normalized to UTC midnight
 * Use this instead of new Date() for date-only fields (entryDate, payDate, dob, etc.)
 * 
 * @returns Date object representing today in Taiwan, stored as UTC midnight
 * @example
 * // Taiwan time: 2025-12-15 14:30
 * const today = getTaiwanToday();
 * // Returns: 2025-12-15T00:00:00.000Z (represents Dec 15 in Taiwan)
 */
export function getTaiwanToday(): Date {
    const now = new Date();
    const taiwanNow = toZonedTime(now, TAIWAN_TZ);
    const taiwanMidnight = startOfDay(taiwanNow);
    return fromZonedTime(taiwanMidnight, TAIWAN_TZ);
}

/**
 * Parse a date string (YYYY-MM-DD) as Taiwan date, return UTC midnight
 * Use this for parsing user input dates
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the Taiwan date, stored as UTC midnight
 * @example
 * const entryDate = parseTaiwanDate('2025-12-15');
 * // Returns: 2025-12-15T00:00:00.000Z
 */
export function parseTaiwanDate(dateString: string): Date {
    // Parse as Taiwan date at midnight
    const taiwanDate = parseISO(dateString + 'T00:00:00');
    return fromZonedTime(taiwanDate, TAIWAN_TZ);
}

/**
 * Convert a Date to Taiwan date string (YYYY-MM-DD)
 * Use this for displaying dates to users
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatTaiwanDate(date: Date | null | undefined): string {
    if (!date) return '';
    const taiwanDate = toZonedTime(date, TAIWAN_TZ);
    return format(taiwanDate, 'yyyy-MM-dd', { timeZone: TAIWAN_TZ });
}

/**
 * Get start of year in Taiwan timezone (Jan 1 at midnight)
 * 
 * @param year - Year number (e.g., 2024)
 * @returns Date object for Jan 1 of the year in Taiwan
 */
export function getTaiwanYearStart(year: number): Date {
    const taiwanDate = new Date(year, 0, 1); // Jan 1 in local
    return fromZonedTime(startOfDay(taiwanDate), TAIWAN_TZ);
}

/**
 * Get end of year in Taiwan timezone (Dec 31 at 23:59:59.999)
 * 
 * @param year - Year number (e.g., 2024)
 * @returns Date object for Dec 31 end of day in Taiwan
 */
export function getTaiwanYearEnd(year: number): Date {
    const taiwanDate = new Date(year, 11, 31, 23, 59, 59, 999); // Dec 31 end
    return fromZonedTime(taiwanDate, TAIWAN_TZ);
}

/**
 * Get start of month in Taiwan timezone
 * 
 * @param year - Year number
 * @param month - Month number (1-12)
 * @returns Date object for first day of month in Taiwan
 */
export function getTaiwanMonthStart(year: number, month: number): Date {
    const taiwanDate = new Date(year, month - 1, 1);
    return fromZonedTime(startOfDay(taiwanDate), TAIWAN_TZ);
}

/**
 * Calculate days between two dates (inclusive)
 * Accounts for Taiwan timezone
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Number of days between dates (inclusive)
 * @example
 * const days = daysBetween(
 *   parseTaiwanDate('2024-01-01'),
 *   parseTaiwanDate('2024-01-03')
 * );
 * // Returns: 3 (Jan 1, Jan 2, Jan 3)
 */
export function daysBetween(start: Date, end: Date): number {
    const taiwanStart = toZonedTime(start, TAIWAN_TZ);
    const taiwanEnd = toZonedTime(end, TAIWAN_TZ);

    const diffTime = taiwanEnd.getTime() - taiwanStart.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
}

/**
 * Add days to a Taiwan date
 * 
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
    return dateFnsAddDays(date, days);
}

/**
 * Get current Taiwan date and time (not normalized)
 * Use this when you need the actual current time in Taiwan timezone
 * 
 * @returns Date object representing current time in Taiwan
 */
export function getTaiwanNow(): Date {
    return toZonedTime(new Date(), TAIWAN_TZ);
}
