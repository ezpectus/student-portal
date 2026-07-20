export const EVENT_TYPES = ['general', 'exam', 'conference', 'holiday', 'deadline'] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  general: 'bg-blue-500',
  exam: 'bg-red-500',
  conference: 'bg-purple-500',
  holiday: 'bg-green-500',
  deadline: 'bg-orange-500',
};

export const EVENT_TYPE_TEXT_COLORS: Record<EventType, string> = {
  general: 'text-blue-600',
  exam: 'text-red-600',
  conference: 'text-purple-600',
  holiday: 'text-green-600',
  deadline: 'text-orange-600',
};
