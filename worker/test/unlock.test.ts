import { describe, it, expect } from 'vitest';
import { calcUnlockDate, daysUntilUnlock, isUnlocked } from '../src/unlock';

describe('calcUnlockDate', () => {
  it('縛りなし（0ヶ月）は契約開始日をそのまま返す', () => {
    const result = calcUnlockDate('2024-03-01', 0);
    expect(result.toISOString().split('T')[0]).toBe('2024-03-01');
  });

  it('24ヶ月縛りは2年後の同日を返す', () => {
    const result = calcUnlockDate('2022-05-15', 24);
    expect(result.toISOString().split('T')[0]).toBe('2024-05-15');
  });

  it('12ヶ月縛りは1年後を返す', () => {
    const result = calcUnlockDate('2025-01-01', 12);
    expect(result.toISOString().split('T')[0]).toBe('2026-01-01');
  });
});

describe('isUnlocked', () => {
  it('縛りなしは常にtrue', () => {
    expect(isUnlocked('2025-01-01', 0, new Date('2020-01-01'))).toBe(true);
  });

  it('解除日当日はtrue', () => {
    expect(isUnlocked('2024-01-01', 24, new Date('2026-01-01'))).toBe(true);
  });

  it('解除日前日はfalse', () => {
    expect(isUnlocked('2024-01-01', 24, new Date('2025-12-31'))).toBe(false);
  });

  it('解除日を過ぎてもtrue', () => {
    expect(isUnlocked('2022-01-01', 24, new Date('2026-05-23'))).toBe(true);
  });
});

describe('daysUntilUnlock', () => {
  it('縛りなしは0を返す', () => {
    expect(daysUntilUnlock('2025-01-01', 0, new Date('2026-01-01'))).toBe(0);
  });

  it('解除済みは負の値を返す', () => {
    const days = daysUntilUnlock('2020-01-01', 12, new Date('2026-05-23'));
    expect(days).toBeLessThan(0);
  });

  it('解除まで30日のとき30を返す', () => {
    // unlock: 2026-06-22、today: 2026-05-23
    expect(daysUntilUnlock('2024-06-22', 24, new Date('2026-05-23T00:00:00Z'))).toBe(30);
  });
});
