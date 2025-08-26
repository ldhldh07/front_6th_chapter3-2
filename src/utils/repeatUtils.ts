import type { Event } from '../types';

export function getNextDailyOccurrence(base: Date, from: Date, interval: number): Date {
  const safeInterval = Math.max(1, interval);
  if (from <= base) return base;

  const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((from.getTime() - base.getTime()) / MILLISECONDS_PER_DAY);
  const steps = Math.ceil(diffDays / safeInterval);

  const next = new Date(base.getTime());
  next.setUTCDate(next.getUTCDate() + steps * safeInterval);
  return next;
}

export function expandEventsToNextOccurrences(events: Event[], _now: Date): Event[] {
  return events;
}
