import type { Event } from '../types';

export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const MS_PER_WEEK = MS_PER_DAY * 7;

export function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

function withNextDate(event: Event, next: Date): Event {
  const nextDateStr = next.toISOString().slice(0, 10);
  return { ...event, id: `${event.id}:${nextDateStr}` as unknown as string, date: nextDateStr };
}

export function addDaysUTC(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function appendIfInRange(
  event: Event,
  cursor: Date,
  rangeStart: Date,
  rangeEnd: Date,
  acc: Event[]
): Event[] {
  if (cursor >= rangeStart && cursor <= rangeEnd) {
    return [...acc, { ...event, date: cursor.toISOString().slice(0, 10) }];
  }
  return acc;
}

export function buildDailyInstances(
  event: Event,
  cursor: Date,
  stopAt: Date,
  rangeStart: Date,
  rangeEnd: Date,
  acc: Event[]
): Event[] {
  if (cursor > stopAt) return acc;
  const nextAcc = appendIfInRange(event, cursor, rangeStart, rangeEnd, acc);
  return buildDailyInstances(event, addDaysUTC(cursor, 1), stopAt, rangeStart, rangeEnd, nextAcc);
}

export function buildWeeklyInstances(
  event: Event,
  cursor: Date,
  stopAt: Date,
  rangeStart: Date,
  rangeEnd: Date,
  interval: number,
  acc: Event[]
): Event[] {
  if (cursor > stopAt || cursor > rangeEnd) return acc;
  const nextAcc = appendIfInRange(event, cursor, rangeStart, rangeEnd, acc);
  return buildWeeklyInstances(
    event,
    addDaysUTC(cursor, 7 * Math.max(1, interval)),
    stopAt,
    rangeStart,
    rangeEnd,
    interval,
    nextAcc
  );
}

export function getNextDailyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = Math.max(1, interval);
  if (from <= base) return base;

  const diffDays = Math.ceil((from.getTime() - base.getTime()) / MS_PER_DAY);
  const steps = Math.ceil(diffDays / safeInterval);

  const next = new Date(base.getTime());
  next.setUTCDate(next.getUTCDate() + steps * safeInterval);
  return next;
}

export function getNextWeeklyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = Math.max(1, interval);
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
  const safeInterval = Math.max(1, interval);
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

export function expandEventsToNextOccurrences(events: Event[], now: Date): Event[] {
  const dateOnly = toUtcDateOnly(now);
  return events.map((ev) => {
    if (ev.repeat.type === 'none') return ev;

    if (ev.repeat.type === 'daily') {
      const base = dateStringToUtcDateOnly(ev.date);
      const next = getNextDailyOccurrence(base, dateOnly, ev.repeat.interval || 1);
      return withNextDate(ev, next);
    }

    if (ev.repeat.type === 'weekly') {
      const base = dateStringToUtcDateOnly(ev.date);
      const next = getNextWeeklyOccurrence(base, dateOnly, ev.repeat.interval || 1);
      return withNextDate(ev, next);
    }

    if (ev.repeat.type === 'yearly') {
      const base = dateStringToUtcDateOnly(ev.date);
      const next = getNextYearlyOccurrence(base, dateOnly, ev.repeat.interval || 1);
      return withNextDate(ev, next);
    }

    return ev;
  });
}

function daysInMonthUTC(year: number, monthZeroBased: number): number {
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
}

function getMonthIndex(year: number, monthZeroBased: number): number {
  return year * 12 + monthZeroBased;
}

function findNextMonthlyOccurrenceFromIndex(
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

function getDateAtMonthIndexOrNextWithDay(idx: number, requiredDay: number): Date {
  const year = Math.floor(idx / 12);
  const month = idx % 12;
  const dim = daysInMonthUTC(year, month);
  if (requiredDay <= dim) {
    return new Date(Date.UTC(year, month, requiredDay));
  }
  return getDateAtMonthIndexOrNextWithDay(idx + 1, requiredDay);
}

function addMonthsUntilHasDay(date: Date, monthsToAdd: number, requiredDay: number): Date {
  const idx = getMonthIndex(date.getUTCFullYear(), date.getUTCMonth()) + monthsToAdd;
  return getDateAtMonthIndexOrNextWithDay(idx, requiredDay);
}

function buildMonthlyInstances(
  event: Event,
  cursor: Date,
  stopAt: Date,
  rangeStart: Date,
  rangeEnd: Date,
  interval: number,
  requiredDay: number,
  acc: Event[]
): Event[] {
  if (cursor > stopAt || cursor > rangeEnd) return acc;
  const nextAcc = appendIfInRange(event, cursor, rangeStart, rangeEnd, acc);
  const next = addMonthsUntilHasDay(cursor, Math.max(1, interval), requiredDay);
  return buildMonthlyInstances(
    event,
    next,
    stopAt,
    rangeStart,
    rangeEnd,
    interval,
    requiredDay,
    nextAcc
  );
}

export function getNextMonthlyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = Math.max(1, interval);
  if (from <= base) return base;

  const targetDay = base.getUTCDate();
  const baseIdx = getMonthIndex(base.getUTCFullYear(), base.getUTCMonth());
  const startIdx = getMonthIndex(from.getUTCFullYear(), from.getUTCMonth());

  return findNextMonthlyOccurrenceFromIndex(startIdx, baseIdx, safeInterval, targetDay, from);
}

export function generateInstances(event: Event, rangeStart: Date, rangeEnd: Date): Event[] {
  const globalCap = new Date('2025-10-30T00:00:00Z');
  const endDate = event.repeat.endDate ? dateStringToUtcDateOnly(event.repeat.endDate) : globalCap;
  const stopAt = endDate < globalCap ? endDate : globalCap;

  if (event.repeat.type === 'daily') {
    return buildDailyInstances(
      event,
      dateStringToUtcDateOnly(event.date),
      stopAt,
      rangeStart,
      rangeEnd,
      []
    );
  }

  if (event.repeat.type === 'weekly') {
    const base = dateStringToUtcDateOnly(event.date);
    const safeInterval = Math.max(1, event.repeat.interval || 1);
    const first = getNextWeeklyOccurrence(base, rangeStart, safeInterval);
    return buildWeeklyInstances(event, first, stopAt, rangeStart, rangeEnd, safeInterval, []);
  }

  if (event.repeat.type === 'monthly') {
    const base = dateStringToUtcDateOnly(event.date);
    const safeInterval = Math.max(1, event.repeat.interval || 1);
    const first = getNextMonthlyOccurrence(base, rangeStart, safeInterval);
    const requiredDay = base.getUTCDate();
    return buildMonthlyInstances(
      event,
      first,
      stopAt,
      rangeStart,
      rangeEnd,
      safeInterval,
      requiredDay,
      []
    );
  }

  return [];
}
