'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export const ExportButtons = () => {
  const t = useTranslations('private.main.dashboard');

  const handleExport = (type: 'grades' | 'attendance') => {
    window.open(`/api/export?type=${type}`, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button variant="tertiary" size="small" onClick={() => handleExport('grades')}>
        <Download className="mr-1 h-4 w-4" />
        {t('export-grades')}
      </Button>
      <Button variant="tertiary" size="small" onClick={() => handleExport('attendance')}>
        <Download className="mr-1 h-4 w-4" />
        {t('export-attendance')}
      </Button>
    </div>
  );
};
