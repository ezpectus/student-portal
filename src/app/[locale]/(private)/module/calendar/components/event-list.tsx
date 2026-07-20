import type { CalendarEvent } from '@/actions/calendar.actions';
import { PencilRegular } from '@/app/images';
import { Button } from '@/components/ui/button';

import { EVENT_TYPE_TEXT_COLORS, type EventType } from '../constants';

interface Props {
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
}

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const EventList = ({ events, onEdit }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start justify-between gap-2 rounded-lg border border-border p-3"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${EVENT_TYPE_TEXT_COLORS[event.type as EventType] ?? 'text-blue-600'}`}>
                {event.type}
              </span>
              <span className="text-sm font-medium">{event.title}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(event.startDate)}
              {event.endDate ? ` — ${formatDate(event.endDate)}` : ''}
            </span>
            {event.location && (
              <span className="text-xs text-muted-foreground">{event.location}</span>
            )}
          </div>
          <Button variant="tertiary" size="small" onClick={() => onEdit(event)}>
            <PencilRegular className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
