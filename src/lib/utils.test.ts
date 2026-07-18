import { describe, it, expect } from 'vitest';
import { cn, round, formatNumber, parseContentDispositionFilename, getUniqueUserPhotoUrl } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('round', () => {
  it('rounds to 2 decimal places by default', () => {
    expect(round(3.14159)).toBe(3.14);
  });

  it('rounds to specified decimal places', () => {
    expect(round(3.14159, 3)).toBe(3.142);
  });

  it('handles integers', () => {
    expect(round(5)).toBe(5);
  });
});

describe('formatNumber', () => {
  it('formats a number with default params', () => {
    const result = formatNumber(1234.5678);
    expect(result).toMatch(/1[\s,.]?234[,.]57/);
  });

  it('respects decimal places parameter', () => {
    const result = formatNumber(1234.5, 0);
    expect(result).toMatch(/1[\s,.]?235/);
  });
});

describe('parseContentDispositionFilename', () => {
  it('parses filename* with encoding', () => {
    const header = "attachment; filename*=UTF-8''%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82.pdf";
    expect(parseContentDispositionFilename(header)).toBe('документ.pdf');
  });

  it('parses plain filename', () => {
    const header = 'attachment; filename="report.pdf"';
    expect(parseContentDispositionFilename(header)).toBe('report.pdf');
  });

  it('parses unquoted filename', () => {
    const header = 'attachment; filename=report.pdf';
    expect(parseContentDispositionFilename(header)).toBe('report.pdf');
  });

  it('returns null for no filename', () => {
    const header = 'attachment';
    expect(parseContentDispositionFilename(header)).toBeNull();
  });
});

describe('getUniqueUserPhotoUrl', () => {
  it('appends a cache-busting query param', () => {
    const result = getUniqueUserPhotoUrl('https://example.com/photo.jpg');
    expect(result).toMatch(/^https:\/\/example\.com\/photo\.jpg\?v=/);
  });

  it('generates different URLs for same input', () => {
    const a = getUniqueUserPhotoUrl('https://example.com/photo.jpg');
    const b = getUniqueUserPhotoUrl('https://example.com/photo.jpg');
    expect(a).not.toBe(b);
  });
});
