import { GLOBAL_REPEAT_CAP } from '../../../utils/repeat/constants';
import {
  dateStringToUtcDateOnly,
  toDateStringUTC,
  clampEndDate,
  daysInMonthUTC,
  addMonthsUntilHasDay,
  getNextMonthlyOccurrence,
  getNextYearlyOccurrence,
  getNextWeeklyOccurrence,
  getNextDailyOccurrence,
} from '../../../utils/repeat/helpers';

describe('helpers - date edge cases', () => {
  it('clampEndDate는 더 이른 날짜를 반환해야 한다', () => {
    const end = dateStringToUtcDateOnly('2025-01-10');
    const cap = GLOBAL_REPEAT_CAP;
    const clamped = clampEndDate(end, cap);
    expect(toDateStringUTC(clamped)).toBe('2025-01-10');
  });

  it('daysInMonthUTC는 2월 윤년/평년과 30/31일을 정확히 반환해야 한다', () => {
    expect(daysInMonthUTC(2024, 1)).toBe(29);
    expect(daysInMonthUTC(2025, 1)).toBe(28);
    expect(daysInMonthUTC(2025, 3)).toBe(30); // April
    expect(daysInMonthUTC(2025, 0)).toBe(31); // Jan
  });

  it('addMonthsUntilHasDay는 1/31에서 2월을 건너뛰고 3/31을 반환해야 한다', () => {
    const base = dateStringToUtcDateOnly('2025-01-31');
    const next = addMonthsUntilHasDay(base, 1, 31);
    expect(toDateStringUTC(next)).toBe('2025-03-31');
  });

  it('getNextMonthlyOccurrence: 1/31 시작, from=2월 → 3/31', () => {
    const base = dateStringToUtcDateOnly('2025-01-31');
    const from = dateStringToUtcDateOnly('2025-02-10');
    const next = getNextMonthlyOccurrence(base, from, 1);
    expect(toDateStringUTC(next)).toBe('2025-03-31');
  });

  it('getNextYearlyOccurrence: 2/29 시작, from=평년 → 다음 윤년', () => {
    const base = dateStringToUtcDateOnly('2024-02-29');
    const from = dateStringToUtcDateOnly('2025-02-28');
    const next = getNextYearlyOccurrence(base, from, 1);
    expect(toDateStringUTC(next)).toBe('2028-02-29');
  });

  it('getNextWeeklyOccurrence: 수요일 시작, from=다음주 월요일 → 다음 수요일', () => {
    const base = dateStringToUtcDateOnly('2025-01-01');
    const from = dateStringToUtcDateOnly('2025-01-06');
    const next = getNextWeeklyOccurrence(base, from, 1);
    expect(toDateStringUTC(next)).toBe('2025-01-08');
  });

  it('getNextDailyOccurrence: from이 더 뒤면 interval에 맞게 다음 날짜', () => {
    const base = dateStringToUtcDateOnly('2025-01-01');
    const from = dateStringToUtcDateOnly('2025-01-03');
    const next = getNextDailyOccurrence(base, from, 1);
    expect(toDateStringUTC(next)).toBe('2025-01-03');
  });
});
