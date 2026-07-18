import dayjs from 'dayjs';

export const isOutdated = (endDate?: Date) => !endDate || dayjs(endDate).isBefore(dayjs());

export const formatDate = (dateString: string) => dayjs(dateString).format('YYYY-MM-DD');

export const formatTime = (dateString: string) => dayjs(dateString).format('HH:mm');
