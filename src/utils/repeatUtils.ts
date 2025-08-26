import type { Event } from '../types';

// Red: intentionally unimplemented so tests fail
export function getNextDailyOccurrence(_base: Date, _from: Date, _interval: number): Date {
  throw new Error('Not implemented');
}

// Keep current app behavior unchanged for now
export function expandEventsToNextOccurrences(events: Event[], _now: Date): Event[] {
  return events;
}
