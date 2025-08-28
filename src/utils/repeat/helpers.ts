import type { Event } from '../../types';

export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const MS_PER_WEEK = MS_PER_DAY * 7;
export const GLOBAL_REPEAT_CAP = new Date('2025-10-30T00:00:00Z');

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
