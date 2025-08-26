import { expandEventsToNextOccurrences, getNextDailyOccurrence } from '../../utils/repeatUtils.ts';
import { getNextWeeklyOccurrence } from '../../utils/repeatUtils.ts';
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
