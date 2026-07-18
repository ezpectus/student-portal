interface IcsEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}

function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateIcsCalendar(events: IcsEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Student Portal//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@student-portal`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(event.startDate)}`,
      `DTEND:${formatIcsDate(event.endDate)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
    );

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsCalendar(filename: string, events: IcsEvent[]): void {
  const icsContent = generateIcsCalendar(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
