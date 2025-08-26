import { getNextDailyOccurrence } from '../../utils/repeatUtils.ts';

describe('getNextDailyOccurrence', () => {
  it('기준일보다 같거나 뒤의 첫 daily 발생일을 반환한다', () => {
    const base = new Date('2025-01-01T00:00:00Z');
    const from = new Date('2025-01-03T00:00:00Z');
    const next = getNextDailyOccurrence(base, from, 1);
    expect(next.toISOString().slice(0, 10)).toBe('2025-01-03');
  });
});
