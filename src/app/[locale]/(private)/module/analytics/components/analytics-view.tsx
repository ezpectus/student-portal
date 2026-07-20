'use client';

import type { AnalyticsData } from '@/actions/analytics.actions';

import { CustomDashboard } from './custom-dashboard';

interface Props {
  data: AnalyticsData;
}

export const AnalyticsView = ({ data }: Props) => {
  return <CustomDashboard data={data} />;
};
