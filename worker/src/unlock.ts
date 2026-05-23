export function calcUnlockDate(contractStart: string, lockInMonths: number): Date {
  const start = new Date(contractStart + 'T00:00:00Z');
  const unlock = new Date(start);
  unlock.setUTCMonth(unlock.getUTCMonth() + lockInMonths);
  return unlock;
}

export function isUnlocked(
  contractStart: string,
  lockInMonths: number,
  today: Date = new Date()
): boolean {
  if (lockInMonths === 0) return true;
  return today >= calcUnlockDate(contractStart, lockInMonths);
}

export function daysUntilUnlock(
  contractStart: string,
  lockInMonths: number,
  today: Date = new Date()
): number {
  if (lockInMonths === 0) return 0;
  const unlock = calcUnlockDate(contractStart, lockInMonths);
  const diffMs = unlock.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
