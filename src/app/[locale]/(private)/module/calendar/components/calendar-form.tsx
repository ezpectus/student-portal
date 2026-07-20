'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { CalendarEvent } from '@/actions/calendar.actions';
import { createEvent, deleteEvent, updateEvent } from '@/actions/calendar.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { useToast } from '@/hooks/use-toast';

import { EVENT_TYPES } from '../constants';

interface Props {
  event: CalendarEvent | null;
  onSubmit: () => void;
}

const toDateTimeLocal = (isoString: string) => {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromDateInput = (value: string) => {
  return new Date(value).toISOString();
};

export const CalendarForm = ({ event, onSubmit }: Props) => {
  const t = useTranslations('private.calendar.form');
  const { errorToast } = useServerErrorToast();
  const { toast } = useToast();

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(event ? toDateTimeLocal(event.startDate) : '');
  const [endDate, setEndDate] = useState(event?.endDate ? toDateTimeLocal(event.endDate) : '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [type, setType] = useState(event?.type ?? 'general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !startDate) return;

    setIsSubmitting(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        startDate: fromDateInput(startDate),
        endDate: endDate ? fromDateInput(endDate) : undefined,
        location: location.trim(),
        type: type as 'general' | 'exam' | 'conference' | 'holiday' | 'deadline',
      };

      if (event) {
        await updateEvent(event.id, data);
        toast({ title: t('updated') });
      } else {
        await createEvent(data);
        toast({ title: t('created') });
      }
      onSubmit();
    } catch {
      errorToast();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      await deleteEvent(event.id);
      toast({ title: t('deleted') });
      onSubmit();
    } catch {
      errorToast();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t('fields.title')}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">{t('fields.description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="startDate">{t('fields.startDate')}</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="endDate">{t('fields.endDate')}</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="location">{t('fields.location')}</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="type">{t('fields.type')}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((eventType) => (
                <SelectItem key={eventType} value={eventType}>
                  {t(`types.${eventType}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {event && (
          <Button type="button" variant="tertiary" onClick={handleDelete} loading={isSubmitting}>
            {t('buttons.delete')}
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} className="ml-auto">
          {event ? t('buttons.update') : t('buttons.create')}
        </Button>
      </div>
    </form>
  );
};
