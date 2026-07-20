'use client';

import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { TeacherCourse } from '@/actions/grading.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/utils/empty-state';

import { GradingTable } from './grading-table';
import { QrAttendanceGenerator } from './qr-attendance-generator';

interface Props {
  courses: TeacherCourse[];
  emptyMessage: string;
}

export const GradingView = ({ courses, emptyMessage }: Props) => {
  const t = useTranslations('private.grading');
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  if (courses.length === 0) {
    return <EmptyState icon={<GraduationCap size={24} />} title={emptyMessage} />;
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <Card>
        <CardHeader>
          <CardTitle>{t('select-course')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder={t('select-placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.name} value={course.name}>
                  {course.name} ({course.studentCount} {t('students')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCourse && (
        <div className="flex flex-col gap-[20px]">
          <div className="grid grid-cols-12 gap-[20px]">
            <div className="col-span-12 xl:col-span-8">
              <GradingTable courseName={selectedCourse} />
            </div>
            <div className="col-span-12 xl:col-span-4">
              <QrAttendanceGenerator courseName={selectedCourse} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
