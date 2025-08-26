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

export function getNextWeeklyOccurrence(_base: Date, _from: Date, _interval: number): Date {
  throw new Error('Not implemented');
}

export function expandEventsToNextOccurrences(events: Event[], now: Date): Event[] {
  const dateOnly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return events.map((ev) => {
    if (ev.repeat.type === 'none') return ev;

    if (ev.repeat.type === 'daily') {
      const base = new Date(ev.date + 'T00:00:00Z');
      const next = getNextDailyOccurrence(base, dateOnly, ev.repeat.interval || 1);
      const nextDateStr = next.toISOString().slice(0, 10);
      return { ...ev, id: `${ev.id}:${nextDateStr}` as unknown as string, date: nextDateStr };
    }

    return ev;
  });
}
