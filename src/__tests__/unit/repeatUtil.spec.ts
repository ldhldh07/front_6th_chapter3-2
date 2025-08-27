import { expandEventsToNextOccurrences, getNextDailyOccurrence } from '../../utils/repeatUtils.ts';
import { getNextWeeklyOccurrence } from '../../utils/repeatUtils.ts';
import { getNextYearlyOccurrence } from '../../utils/repeatUtils.ts';
import { generateInstances } from '../../utils/repeatUtils.ts';
import { makeEvent } from '../utils.ts';

describe('getNextDailyOccurrence', () => {
  it('기준일보다 같거나 뒤의 첫 daily 발생일을 반환한다', () => {
    const base = new Date('2025-01-01T00:00:00Z');
    const from = new Date('2025-01-03T00:00:00Z');
    const next = getNextDailyOccurrence(base, from, 1);
    expect(next.toISOString().slice(0, 10)).toBe('2025-01-03');
  });
});

describe('expandEventsToNextOccurrences - daily', () => {
  it('반복 이벤트는 다음 발생 일자로 확장되고 id가 날짜와 결합된다', () => {
    const events = [
      makeEvent({
        id: 'e1',
        title: 'Daily',
        date: '2025-01-01',
        repeat: { type: 'daily', interval: 1 },
      }),
    ];

    const now = new Date('2025-01-02T00:00:00Z');
    const expanded = expandEventsToNextOccurrences(events, now);
    expect(expanded).toHaveLength(1);
    expect(expanded[0].date).toBe('2025-01-02');
    expect(String(expanded[0].id)).toBe('e1:2025-01-02');
  });
});

describe('expandEventsToNextOccurrences - weekly', () => {
  it('weekly 이벤트는 다음 동일 요일로 확장되고 id에 날짜가 결합된다', () => {
    const events = [
      makeEvent({
        id: 'e2',
        title: 'Weekly',
        date: '2025-01-01',
        repeat: { type: 'weekly', interval: 1 },
      }),
    ];

    const now = new Date('2025-01-06T00:00:00Z'); // 다음 주 월요일
    const expanded = expandEventsToNextOccurrences(events, now);
    expect(expanded).toHaveLength(1);
    expect(expanded[0].date).toBe('2025-01-08'); // 다음 수요일
    expect(String(expanded[0].id)).toBe('e2:2025-01-08');
  });
});

describe('getNextWeeklyOccurrence', () => {
  it('기준일 수요일(2025-01-01), from 다음주 월요일(2025-01-06), 매 1주 → 다음 수요일(2025-01-08)', () => {
    const base = new Date('2025-01-01T00:00:00Z');
    const from = new Date('2025-01-06T00:00:00Z');
    const next = getNextWeeklyOccurrence(base, from, 1);
    expect(next.toISOString().slice(0, 10)).toBe('2025-01-08');
  });
});

describe('getNextYearlyOccurrence', () => {
  it('2/29 시작, from=평년 → 다음 윤년 2/29', () => {
    const base = new Date('2024-02-29T00:00:00Z');
    const from = new Date('2025-02-28T00:00:00Z');
    const next = getNextYearlyOccurrence(base, from, 1);
    expect(next.toISOString().slice(0, 10)).toBe('2028-02-29');
  });
});

describe('expandEventsToNextOccurrences - yearly', () => {
  it('yearly(2/29) 이벤트는 다음 윤년 2/29로 확장되고 id에 날짜가 결합된다', () => {
    const events = [
      makeEvent({
        id: 'e3',
        title: 'Yearly',
        date: '2024-02-29',
        repeat: { type: 'yearly', interval: 1 },
      }),
    ];

    const now = new Date('2025-02-28T00:00:00Z');
    const expanded = expandEventsToNextOccurrences(events, now);
    expect(expanded).toHaveLength(1);
    expect(expanded[0].date).toBe('2028-02-29');
    expect(String(expanded[0].id)).toBe('e3:2028-02-29');
  });
});

describe('generateInstances - daily', () => {
  it('주간 범위 내에서만 daily 인스턴스를 생성한다', () => {
    const base = makeEvent({
      id: 'e4',
      title: 'Daily',
      date: '2025-01-01',
      repeat: { type: 'daily', interval: 1, endDate: '2025-01-05' },
    });
    const rangeStart = new Date('2025-01-02T00:00:00Z');
    const rangeEnd = new Date('2025-01-04T00:00:00Z');

    const instances = generateInstances(base, rangeStart, rangeEnd);
    expect(instances.map((e) => e.date)).toEqual(['2025-01-02', '2025-01-03', '2025-01-04']);
  });
});

describe('generateInstances - weekly', () => {
  it('주간 범위 내에서만 weekly(같은 요일) 인스턴스를 생성한다', () => {
    const base = makeEvent({
      id: 'e5',
      title: 'Weekly',
      date: '2025-01-01', // 수요일
      repeat: { type: 'weekly', interval: 1, endDate: '2025-01-30' },
    });

    const rangeStart = new Date('2025-01-05T00:00:00Z');
    const rangeEnd = new Date('2025-01-20T00:00:00Z');

    const instances = generateInstances(base, rangeStart, rangeEnd);
    expect(instances.map((e) => e.date)).toEqual(['2025-01-08', '2025-01-15']);
  });
});

describe('generateInstances - monthly', () => {
  it('31일 시작 monthly는 31일이 없는 달(Feb)을 건너뛰고 3월 31일만 생성한다', () => {
    const base = makeEvent({
      id: 'e6',
      title: 'Monthly-31',
      date: '2025-01-31',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-03-31' },
    });

    const rangeStart = new Date('2025-02-01T00:00:00Z');
    const rangeEnd = new Date('2025-03-31T00:00:00Z');

    const instances = generateInstances(base, rangeStart, rangeEnd);
    expect(instances.map((e) => e.date)).toEqual(['2025-03-31']);
  });
});
