import { describe, expect,it } from 'vitest';

import { generateIcsCalendar } from '@/lib/utils/ics-export';

describe('generateIcsCalendar', () => {
  it('generates valid ICS structure', () => {
    const ics = generateIcsCalendar([
      {
        title: 'Math Exam',
        startDate: new Date('2026-01-15T10:00:00Z'),
        endDate: new Date('2026-01-15T12:00:00Z'),
      },
    ]);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('SUMMARY:Math Exam');
  });

  it('formats dates in UTC ICS format', () => {
    const ics = generateIcsCalendar([
      {
        title: 'Test',
        startDate: new Date('2026-01-15T10:00:00Z'),
        endDate: new Date('2026-01-15T12:00:00Z'),
      },
    ]);

    expect(ics).toContain('DTSTART:20260115T100000Z');
    expect(ics).toContain('DTEND:20260115T120000Z');
  });

  it('includes optional fields when provided', () => {
    const ics = generateIcsCalendar([
      {
        title: 'Lecture',
        description: 'Introduction to Algorithms',
        location: 'Room 101',
        startDate: new Date('2026-01-15T10:00:00Z'),
        endDate: new Date('2026-01-15T11:00:00Z'),
      },
    ]);

    expect(ics).toContain('DESCRIPTION:Introduction to Algorithms');
    expect(ics).toContain('LOCATION:Room 101');
  });

  it('escapes special characters in text', () => {
    const ics = generateIcsCalendar([
      {
        title: 'Test, with commas; and \\ backslash',
        startDate: new Date('2026-01-15T10:00:00Z'),
        endDate: new Date('2026-01-15T11:00:00Z'),
      },
    ]);

    expect(ics).toContain('SUMMARY:Test\\, with commas\\; and \\\\ backslash');
  });

  it('handles multiple events', () => {
    const ics = generateIcsCalendar([
      {
        title: 'Event 1',
        startDate: new Date('2026-01-15T10:00:00Z'),
        endDate: new Date('2026-01-15T11:00:00Z'),
      },
      {
        title: 'Event 2',
        startDate: new Date('2026-01-16T10:00:00Z'),
        endDate: new Date('2026-01-16T11:00:00Z'),
      },
    ]);

    const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(veventCount).toBe(2);
  });

  it('uses CRLF line endings per RFC 5545', () => {
    const ics = generateIcsCalendar([
      {
        title: 'Test',
        startDate: new Date('2026-01-15T10:00:00Z'),
        endDate: new Date('2026-01-15T11:00:00Z'),
      },
    ]);

    expect(ics).toContain('\r\n');
  });
});
