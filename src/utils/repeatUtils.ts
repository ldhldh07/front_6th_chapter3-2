import type { Event } from '../types';

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function withNextDate(event: Event, next: Date): Event {
  const nextDateStr = next.toISOString().slice(0, 10);
  return { ...event, id: `${event.id}:${nextDateStr}` as unknown as string, date: nextDateStr };
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

  const weeksBetween = Math.ceil((candidate.getTime() - base.getTime()) / (MS_PER_DAY * 7));
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
    let year = from.getUTCFullYear();
    const candidateThisYear = new Date(Date.UTC(year, 1, 29));
    const isLeap = (y: number) => y % 400 === 0 || (y % 4 === 0 && y % 100 !== 0);
    if (!isLeap(year) || candidateThisYear < from) {
      year += 1;
      while (!isLeap(year)) year += 1;
    }
    return new Date(Date.UTC(year, 1, 29));
  }

  let year = from.getUTCFullYear();
  let candidate = new Date(Date.UTC(year, targetMonth, targetDay));
  if (candidate < from) {
    year += safeInterval;
    candidate = new Date(Date.UTC(year, targetMonth, targetDay));
  }
  return candidate;
}

export function expandEventsToNextOccurrences(events: Event[], now: Date): Event[] {
  const dateOnly = toUtcDateOnly(now);
  return events.map((ev) => {
    if (ev.repeat.type === 'none') return ev;

    if (ev.repeat.type === 'daily') {
      const base = new Date(ev.date + 'T00:00:00Z');
      const next = getNextDailyOccurrence(base, dateOnly, ev.repeat.interval || 1);
      return withNextDate(ev, next);
    }

    if (ev.repeat.type === 'weekly') {
      const base = new Date(ev.date + 'T00:00:00Z');
      const next = getNextWeeklyOccurrence(base, dateOnly, ev.repeat.interval || 1);
      return withNextDate(ev, next);
    }

    return ev;
  });
}
