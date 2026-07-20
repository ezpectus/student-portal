'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import type { CalendarEvent } from '@/actions/calendar.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Show } from '@/components/utils/show';

import { EVENT_TYPE_COLORS, type EventType } from '../constants';
import { CalendarForm } from './calendar-form';
import { EventList } from './event-list';

interface Props {
  events: CalendarEvent[];
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isEventOnDay = (event: CalendarEvent, day: Date) => {
  const eventStart = new Date(event.startDate);
  if (isSameDay(eventStart, day)) return true;
  if (event.endDate) {
    const eventEnd = new Date(event.endDate);
    const dayTime = day.getTime();
    return eventStart.getTime() <= dayTime && eventEnd.getTime() >= dayTime;
  }
  return false;
};

export const CalendarView = ({ events }: Props) => {
  const t = useTranslations('private.calendar');

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setToday(now);
  }, []);

  const calendarDays = useMemo(() => {
    if (!currentDate) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of calendarDays) {
      if (!day) continue;
      const key = day.toISOString().split('T')[0];
      const dayEvents = events.filter((e) => isEventOnDay(e, day));
      if (dayEvents.length > 0) {
        map.set(key, dayEvents);
      }
    }
    return map;
  }, [calendarDays, events]);

  const upcomingEvents = useMemo(() => {
    if (!today) return [];
    return events
      .filter((e) => new Date(e.startDate) >= today)
      .slice(0, 10);
  }, [events, today]);

  const handlePrevMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleCreateClick = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const monthLabel = useMemo(() => {
    if (!currentDate) return '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);

  if (!currentDate) {
    return (
      <div className="flex flex-col gap-[20px]">
        <Card>
          <CardContent className="grid grid-cols-7 gap-1 py-4">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[80px] rounded-lg bg-muted/30" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="small" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold capitalize">{monthLabel}</span>
          <Button variant="secondary" size="small" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button size="small" onClick={handleCreateClick}>
          <Plus className="mr-1 h-4 w-4" />
          {t('actions.create')}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-[20px]">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {t(`weekdays.${day}`)}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="min-h-[80px] rounded-lg bg-muted/30" />;
                }
                const dayKey = day.toISOString().split('T')[0];
                const dayEvents = eventsByDay.get(dayKey) ?? [];
                const isToday = today && isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[80px] rounded-lg border p-1 text-left transition-colors hover:bg-accent ${
                      isToday ? 'border-primary' : 'border-border'
                    } ${isSelected ? 'bg-accent' : ''}`}
                  >
                    <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {day.getDate()}
                    </span>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`truncate rounded px-1 py-0.5 text-[10px] text-white ${EVENT_TYPE_COLORS[event.type as EventType] ?? 'bg-blue-500'}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3} {t('more')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-12 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('upcoming')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Show when={upcomingEvents.length > 0} fallback={
                <p className="text-muted-foreground py-8 text-center text-sm">{t('no-events')}</p>
              }>
                <EventList events={upcomingEvents} onEdit={handleEditClick} />
              </Show>
            </CardContent>
          </Card>

          <Show when={!!selectedDate}>
            <Card className="mt-[20px]">
              <CardHeader>
                <CardTitle>
                  {selectedDate?.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dayKey = selectedDate!.toISOString().split('T')[0];
                  const dayEvents = eventsByDay.get(dayKey) ?? [];
                  if (dayEvents.length === 0) {
                    return <p className="text-muted-foreground py-4 text-center text-sm">{t('no-events')}</p>;
                  }
                  return <EventList events={dayEvents} onEdit={handleEditClick} />;
                })()}
              </CardContent>
            </Card>
          </Show>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleFormClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? t('form.edit') : t('form.create')}
            </DialogTitle>
          </DialogHeader>
          <CalendarForm
            event={editingEvent}
            onSubmit={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
