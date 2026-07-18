'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportToCsv } from '@/lib/utils/csv-export';

interface Props {
  gpaTrend: { semester: string; gpa: number }[];
  gradeDistribution: { name: string; value: number; color: string }[];
  attendanceData: { month: string; attended: number; missed: number }[];
}

export const DashboardCharts = ({ gpaTrend, gradeDistribution, attendanceData }: Props) => {
  const t = useTranslations('private.main.dashboard');

  return (
    <div className="grid grid-cols-12 gap-[20px]">
      <Card className="col-span-12 xl:col-span-8">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t('gpa-trend')}</CardTitle>
          <Button
            variant="tertiary"
            size="small"
            icon={<Download className="h-4 w-4" />}
            onClick={() =>
              exportToCsv(
                'gpa-trend.csv',
                [t('semester'), t('gpa')],
                gpaTrend.map((d) => [d.semester, d.gpa]),
              )
            }
          >
            {t('export')}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={gpaTrend}>
              <defs>
                <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="semester"
                label={{ value: t('semester'), position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[2, 4]}
                label={{ value: t('gpa'), angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="gpa"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gpaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-12 xl:col-span-4">
        <CardHeader>
          <CardTitle>{t('grade-distribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {gradeDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {gradeDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-neutral-600">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t('attendance')}</CardTitle>
          <Button
            variant="tertiary"
            size="small"
            icon={<Download className="h-4 w-4" />}
            onClick={() =>
              exportToCsv(
                'attendance.csv',
                [t('attended'), t('missed')],
                attendanceData.map((d) => [d.month, d.attended, d.missed]),
              )
            }
          >
            {t('export')}
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="attended" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
