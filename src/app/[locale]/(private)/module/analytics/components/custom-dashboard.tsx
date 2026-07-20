'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { AnalyticsData } from '@/actions/analytics.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/use-storage';
import { useToast } from '@/hooks/use-toast';

import { DashboardWidget } from './dashboard-widget';

export type WidgetId =
  | 'metrics'
  | 'user-activity'
  | 'role-distribution'
  | 'registrations'
  | 'faculty-distribution'
  | 'grade-distribution'
  | 'cohorts'
  | 'curriculum-analytics'
  | 'teacher-effectiveness'
  | 'at-risk-students';

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'metrics', visible: true },
  { id: 'user-activity', visible: true },
  { id: 'role-distribution', visible: true },
  { id: 'registrations', visible: true },
  { id: 'faculty-distribution', visible: true },
  { id: 'grade-distribution', visible: true },
  { id: 'cohorts', visible: true },
  { id: 'curriculum-analytics', visible: true },
  { id: 'teacher-effectiveness', visible: true },
  { id: 'at-risk-students', visible: true },
];

interface Props {
  data: AnalyticsData;
}

export const CustomDashboard = ({ data }: Props) => {
  const t = useTranslations('private.analytics');
  const { toast } = useToast();
  const [storedWidgets, setWidgets] = useLocalStorage<WidgetConfig[]>('analytics-dashboard-layout', DEFAULT_WIDGETS);
  const widgets = storedWidgets ?? DEFAULT_WIDGETS;
  const [editMode, setEditMode] = useState(false);

  const visibleWidgets = widgets.filter((w) => w.visible);

  const handleToggleWidget = (id: WidgetId, visible: boolean) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, visible } : w)));
  };

  const handleReset = () => {
    setWidgets(DEFAULT_WIDGETS);
    toast({ title: t('dashboard.reset') });
  };

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch checked={editMode} onCheckedChange={setEditMode} />
          <span className="text-sm font-medium">{t('dashboard.edit-mode')}</span>
        </div>
        {editMode && (
          <div className="flex gap-2">
            <Button variant="tertiary" size="small" onClick={handleReset}>
              {t('dashboard.reset')}
            </Button>
            <Button size="small" onClick={() => setEditMode(false)}>
              {t('dashboard.save')}
            </Button>
          </div>
        )}
      </div>

      {editMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard.widgets')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {widgets.map((widget) => (
                <label key={widget.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                  />
                  <span className="text-sm">{t(`dashboard.widget-titles.${widget.id}`)}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-[20px]">
        {visibleWidgets.map((widget) => (
          <DashboardWidget key={widget.id} id={widget.id} data={data} editMode={editMode} />
        ))}
      </div>
    </div>
  );
};
