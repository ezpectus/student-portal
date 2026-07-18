'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, UserCheck, TrendingUp } from 'lucide-react';

interface Props {
  totalUsers: number;
  students: number;
  activeStudents: number;
  avgGpa: number;
}

export const AdminStatsCards = ({ totalUsers, students, activeStudents, avgGpa }: Props) => {
  const t = useTranslations('private.admin.stats');

  const stats = [
    { label: t('total-users'), value: totalUsers, icon: <Users size={20} />, color: 'text-other-blue' },
    { label: t('students'), value: students, icon: <GraduationCap size={20} />, color: 'text-other-purple' },
    { label: t('active-students'), value: activeStudents, icon: <UserCheck size={20} />, color: 'text-green-600' },
    { label: t('avg-gpa'), value: avgGpa.toFixed(2), icon: <TrendingUp size={20} />, color: 'text-other-orange' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={stat.color}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-neutral-500">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
