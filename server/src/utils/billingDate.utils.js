/**
 * Billing Date Utilities
 * Handles next billing dates, plan expiry dates, availability checks,
 * month-end dates, and leap years correctly.
 */

export const BILLING_INTERVALS = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

/**
 * Checks whether a given year is a leap year.
 *
 * @param {number} year
 * @returns {boolean}
 */
export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Returns number of days in a given month of a given year (1-indexed month: 1=Jan, 12=Dec).
 *
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {number}
 */
export const getDaysInMonth = (year, month) => {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/**
 * Add calendar months to a date, preserving month-end behavior.
 * E.g., Jan 31 + 1 month = Feb 28 (or 29 in leap year).
 *
 * @param {Date} date
 * @param {number} monthsToAdd
 * @returns {Date}
 */
export const addMonthsPreservingMonthEnd = (date, monthsToAdd) => {
  const d = new Date(date);
  const targetYear = d.getUTCFullYear();
  const targetMonth = d.getUTCMonth(); // 0-indexed
  const originalDay = d.getUTCDate();

  // New month/year calculation
  const newDate = new Date(Date.UTC(targetYear, targetMonth + monthsToAdd, 1));
  const newYear = newDate.getUTCFullYear();
  const newMonth = newDate.getUTCMonth() + 1; // 1-indexed

  const daysInNewMonth = getDaysInMonth(newYear, newMonth);
  const clampedDay = Math.min(originalDay, daysInNewMonth);

  return new Date(Date.UTC(
    newYear,
    newMonth - 1,
    clampedDay,
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  ));
};

/**
 * Calculates the next billing date based on billing interval.
 *
 * @param {Date|string|number} fromDate - Starting date
 * @param {string} interval - "daily" | "weekly" | "monthly" | "yearly"
 * @returns {Date} Next billing date
 */
export const calculateNextBillingDate = (fromDate = new Date(), interval = BILLING_INTERVALS.MONTHLY) => {
  const d = new Date(fromDate);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid start date provided for calculateNextBillingDate");
  }

  const normalizedInterval = String(interval).toLowerCase().trim();

  switch (normalizedInterval) {
    case BILLING_INTERVALS.DAILY: {
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }

    case BILLING_INTERVALS.WEEKLY: {
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }

    case BILLING_INTERVALS.MONTHLY: {
      return addMonthsPreservingMonthEnd(d, 1);
    }

    case BILLING_INTERVALS.YEARLY: {
      return addMonthsPreservingMonthEnd(d, 12);
    }

    default:
      throw new Error(`Unsupported billing interval: ${interval}`);
  }
};

/**
 * Calculates plan expiry date given a start date, interval, and cycle count.
 *
 * @param {Date|string|number} startDate
 * @param {string} interval
 * @param {number} cycles - Number of billing cycles until expiry
 * @returns {Date} Expiry date
 */
export const calculatePlanExpiryDate = (startDate = new Date(), interval = BILLING_INTERVALS.MONTHLY, cycles = 1) => {
  const count = Math.max(1, parseInt(cycles, 10) || 1);
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    current = calculateNextBillingDate(current, interval);
  }

  return current;
};

/**
 * Checks whether a plan is currently available based on its status and date window.
 *
 * @param {object} plan - Plan document or object
 * @param {Date} [atDate=new Date()] - Reference date
 * @returns {boolean} True if plan is active and within availableFrom/availableUntil
 */
export const isPlanAvailable = (plan, atDate = new Date()) => {
  if (!plan) return false;
  if (plan.isActive === false) return false;

  const refTime = new Date(atDate).getTime();

  if (plan.availableFrom) {
    const fromTime = new Date(plan.availableFrom).getTime();
    if (refTime < fromTime) {
      return false;
    }
  }

  if (plan.availableUntil) {
    const untilTime = new Date(plan.availableUntil).getTime();
    if (refTime > untilTime) {
      return false;
    }
  }

  return true;
};
