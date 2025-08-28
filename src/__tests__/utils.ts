import type { Event } from '../types';
import { fillZero } from '../utils/dateUtils';

export const assertDate = (date1: Date, date2: Date) => {
  expect(date1.toISOString()).toBe(date2.toISOString());
};

export const parseHM = (timestamp: number) => {
  const date = new Date(timestamp);
  const h = fillZero(date.getHours());
  const m = fillZero(date.getMinutes());
  return `${h}:${m}`;
};

export function makeEvent(overrides: Partial<Event> = {}): Event {
  const base: Event = {
    id: 'e0',
    title: '테스트 이벤트',
    date: '2025-01-01',
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
    category: '',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 10,
  };

  return {
    ...base,
    ...overrides,
    repeat: { ...base.repeat, ...(overrides.repeat ?? {}) },
  };
}
