import { MS_PER_WEEK, MS_PER_DAY } from './constants';
import type { Event } from '../../types';

export function getSafeInterval(interval?: number): number {
  return Math.max(1, interval ?? 1);
}

export function clampEndDate(endDate: Date | undefined, cap: Date): Date {
  return endDate && endDate < cap ? endDate : cap;
}

export function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toDateStringUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function getNextLeapYear(year: number): number {
  return isLeapYear(year) ? year : getNextLeapYear(year + 1);
}

export function dateStringToUtcDateOnly(dateString: string): Date {
  return new Date(`${dateString}T00:00:00Z`);
}

export function withNextDate(event: Event, next: Date): Event {
  const nextDateStr = toDateStringUTC(next);
  return { ...event, id: `${event.id}:${nextDateStr}`, date: nextDateStr };
}

export function addDaysUTC(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function daysInMonthUTC(year: number, monthZeroBased: number): number {
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
}

export function getMonthIndex(year: number, monthZeroBased: number): number {
  return year * 12 + monthZeroBased;
}

export function findNextMonthlyOccurrenceFromIndex(
  startIdx: number,
  baseIdx: number,
  safeInterval: number,
  targetDay: number,
  from: Date
): Date {
  const year = Math.floor(startIdx / 12);
  const month = startIdx % 12;
  const dim = daysInMonthUTC(year, month);
  const hasTarget = targetDay <= dim;
  const candidate = hasTarget ? new Date(Date.UTC(year, month, targetDay)) : undefined;
  const isAligned = (startIdx - baseIdx) % safeInterval === 0;
  if (candidate && candidate >= from && isAligned) return candidate;
  return findNextMonthlyOccurrenceFromIndex(startIdx + 1, baseIdx, safeInterval, targetDay, from);
}

export function getDateAtMonthIndexOrNextWithDay(idx: number, requiredDay: number): Date {
  const year = Math.floor(idx / 12);
  const month = idx % 12;
  const dim = daysInMonthUTC(year, month);
  if (requiredDay <= dim) {
    return new Date(Date.UTC(year, month, requiredDay));
  }
  return getDateAtMonthIndexOrNextWithDay(idx + 1, requiredDay);
}

export function addMonthsUntilHasDay(date: Date, monthsToAdd: number, requiredDay: number): Date {
  const idx = getMonthIndex(date.getUTCFullYear(), date.getUTCMonth()) + monthsToAdd;
  return getDateAtMonthIndexOrNextWithDay(idx, requiredDay);
}

export function getNextMonthlyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = getSafeInterval(interval);
  if (from <= base) return base;

  const targetDay = base.getUTCDate();
  const baseIdx = getMonthIndex(base.getUTCFullYear(), base.getUTCMonth());
  const startIdx = getMonthIndex(from.getUTCFullYear(), from.getUTCMonth());

  return findNextMonthlyOccurrenceFromIndex(startIdx, baseIdx, safeInterval, targetDay, from);
}

export function getNextDailyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = getSafeInterval(interval);
  if (from <= base) return base;

  const diffDays = Math.ceil((from.getTime() - base.getTime()) / MS_PER_DAY);
  const steps = Math.ceil(diffDays / safeInterval);

  const next = new Date(base.getTime());
  next.setUTCDate(next.getUTCDate() + steps * safeInterval);
  return next;
}

export function getNextWeeklyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = getSafeInterval(interval);
  if (from <= base) return base;

  const baseWeekday = base.getUTCDay();
  const fromWeekday = from.getUTCDay();
  const daysDiffToSameWeekday = (baseWeekday - fromWeekday + 7) % 7;

  const candidate = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + daysDiffToSameWeekday)
  );

  const weeksBetween = Math.ceil((candidate.getTime() - base.getTime()) / MS_PER_WEEK);
  const remainder = ((weeksBetween % safeInterval) + safeInterval) % safeInterval;
  const addWeeks = remainder === 0 ? 0 : safeInterval - remainder;

  const next = new Date(candidate.getTime());
  next.setUTCDate(next.getUTCDate() + addWeeks * 7);
  return next;
}

export function getNextYearlyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = getSafeInterval(interval);
  if (from <= base) return base;

  const targetMonth = base.getUTCMonth();
  const targetDay = base.getUTCDate();

  const isFeb29 = targetMonth === 1 && targetDay === 29;

  if (isFeb29) {
    const startYear = from.getUTCFullYear();
    const thisYearDate = new Date(Date.UTC(startYear, 1, 29));
    const candidateYear =
      isLeapYear(startYear) && thisYearDate >= from ? startYear : getNextLeapYear(startYear + 1);
    return new Date(Date.UTC(candidateYear, 1, 29));
  }

  const fromYear = from.getUTCFullYear();
  const candidate = new Date(Date.UTC(fromYear, targetMonth, targetDay));
  const adjustedYear = candidate < from ? fromYear + safeInterval : fromYear;
  return new Date(Date.UTC(adjustedYear, targetMonth, targetDay));
}
