'use client';

import { AlertTriangle,Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getGradePredictions,type SemesterPrediction } from '@/actions/grade-predictions.actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const riskVariant = {
  low: 'success' as const,
  medium: 'orange' as const,
  high: 'error' as const,
};

export const GradePredictionsWidget = () => {
  const t = useTranslations('private.predictions');
  const [data, setData] = useState<SemesterPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGradePredictions().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-muted-foreground text-xs">{t('current-gpa')}</p>
            <p className="text-2xl font-bold">{data.currentGpa}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('predicted-gpa')}</p>
            <p className={`text-2xl font-bold ${data.predictedGpa < data.currentGpa ? 'text-red-500' : 'text-green-500'}`}>
              {data.predictedGpa}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('credits')}</p>
            <p className="text-2xl font-bold">{data.totalCredits}</p>
          </div>
          {data.atRiskCourses > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-500">
                {data.atRiskCourses} {t('at-risk')}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {t(data.summaryKey, data.summaryParams)}
        </p>

        <div className="flex flex-col gap-2">
          {data.courses.map((course) => (
            <div
              key={course.courseName}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{course.courseName}</span>
                  <TrendIcon trend={course.trend} />
                </div>
                <span className="text-muted-foreground text-xs">
                  {course.reasonKeys.map((key) => t(`reasons.${key}`)).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">{t('now')}</p>
                  <p className="text-sm font-medium">{course.currentGrade}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">{t('forecast')}</p>
                  <p className={`text-sm font-bold ${
                    course.predictedGrade < course.currentGrade ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {course.predictedGrade}
                  </p>
                </div>
                <Badge variant={riskVariant[course.riskLevel]}>
                  {t(`risk.${course.riskLevel}`)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
