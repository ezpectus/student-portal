import { describe, it, expect } from 'vitest';
import { isOutdated, formatDate, formatTime } from '@/lib/date.utils';

describe('isOutdated', () => {
  it('returns true for past dates', () => {
    const pastDate = new Date('2020-01-01');
    expect(isOutdated(pastDate)).toBe(true);
  });

  it('returns false for future dates', () => {
    const futureDate = new Date('2099-01-01');
    expect(isOutdated(futureDate)).toBe(false);
  });

  it('returns true for undefined', () => {
    expect(isOutdated(undefined)).toBe(true);
  });
});

describe('formatDate', () => {
  it('formats a date string as YYYY-MM-DD', () => {
    expect(formatDate('2024-03-15T10:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatTime', () => {
  it('formats a time string as HH:mm', () => {
    expect(formatTime('2024-03-15T10:30:00')).toMatch(/^\d{2}:\d{2}$/);
  });
});
