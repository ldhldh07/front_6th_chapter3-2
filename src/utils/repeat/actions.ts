import { GLOBAL_REPEAT_CAP } from './constants';
import {
  toDateStringUTC,
  addDaysUTC,
  toUtcDateOnly,
  dateStringToUtcDateOnly,
  withNextDate,
  clampEndDate,
  getSafeInterval,
} from './formats';
import {
  getNextDailyOccurrence,
  getNextWeeklyOccurrence,
  getNextYearlyOccurrence,
  addMonthsUntilHasDay,
  getNextMonthlyOccurrence,
} from './helpers';
import type { Event } from '../../types';

function appendIfInRange(
  event: Event,
  cursor: Date,
  rangeStart: Date,
  rangeEnd: Date,
  acc: Event[]
): Event[] {
  if (cursor >= rangeStart && cursor <= rangeEnd) {
    return [...acc, { ...event, date: toDateStringUTC(cursor) }];
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
  if (cursor > stopAt || cursor > rangeEnd) return acc;
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

// moved: getNext*Occurrence to helpers

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

// moved: monthly helpers to helpers.ts

function buildYearlyInstances(
  event: Event,
  base: Date,
  cursor: Date,
  stopAt: Date,
  rangeStart: Date,
  rangeEnd: Date,
  interval: number,
  acc: Event[]
): Event[] {
  if (cursor > stopAt || cursor > rangeEnd) return acc;
  const nextAcc = appendIfInRange(event, cursor, rangeStart, rangeEnd, acc);
  const next = getNextYearlyOccurrence(base, addDaysUTC(cursor, 1), Math.max(1, interval));
  return buildYearlyInstances(event, base, next, stopAt, rangeStart, rangeEnd, interval, nextAcc);
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

// moved: getNextMonthlyOccurrence to helpers

export function generateInstances(event: Event, rangeStart: Date, rangeEnd: Date): Event[] {
  const endDate = event.repeat.endDate ? dateStringToUtcDateOnly(event.repeat.endDate) : undefined;
  const stopAt = clampEndDate(endDate, GLOBAL_REPEAT_CAP);

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
    const safeInterval = getSafeInterval(event.repeat.interval);
    const first = getNextWeeklyOccurrence(base, rangeStart, safeInterval);
    return buildWeeklyInstances(event, first, stopAt, rangeStart, rangeEnd, safeInterval, []);
  }

  if (event.repeat.type === 'monthly') {
    const base = dateStringToUtcDateOnly(event.date);
    const safeInterval = getSafeInterval(event.repeat.interval);
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

  if (event.repeat.type === 'yearly') {
    const base = dateStringToUtcDateOnly(event.date);
    const safeInterval = getSafeInterval(event.repeat.interval);
    const first = getNextYearlyOccurrence(base, rangeStart, safeInterval);
    return buildYearlyInstances(event, base, first, stopAt, rangeStart, rangeEnd, safeInterval, []);
  }

  return [];
}
