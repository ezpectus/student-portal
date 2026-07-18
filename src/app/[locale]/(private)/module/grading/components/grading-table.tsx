'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { getCourseStudents, updateGrade, type CourseStudent } from '@/actions/grading.actions';
import { EmptyState } from '@/components/utils/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { displayGrade, type GradeType } from '@/lib/grade-utils';

interface Props {
  courseName: string;
}

export const GradingTable = ({ courseName }: Props) => {
  const t = useTranslations('private.grading');
  const { toast } = useToast();
  const { errorToast } = useServerErrorToast();

  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editGradeType, setEditGradeType] = useState<GradeType>('NUMERIC');

  useEffect(() => {
    setLoading(true);
    getCourseStudents(courseName)
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [courseName]);

  const handleSave = async (student: CourseStudent) => {
    const newGrade = parseFloat(editValue);
    if (isNaN(newGrade) || newGrade < 0 || newGrade > 100) {
      toast({ title: t('validation.grade-range'), variant: 'destructive' });
      return;
    }

    try {
      await updateGrade({ courseId: student.id, grade: newGrade, gradeType: editGradeType });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, grade: newGrade, gradeType: editGradeType } : s)),
      );
      toast({ title: t('success.grade-updated'), description: student.studentName });
      setEditingId(null);
    } catch {
      errorToast();
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{t('loading')}</p>;
  }

  if (students.length === 0) {
    return <EmptyState title={t('no-students')} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.student')}</TableHead>
          <TableHead className="w-32">{t('table.group')}</TableHead>
          <TableHead className="w-24">{t('table.credits')}</TableHead>
          <TableHead className="w-28">{t('table.grade-type')}</TableHead>
          <TableHead className="w-40">{t('table.grade')}</TableHead>
          <TableHead className="w-24">{t('table.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.studentName}</TableCell>
            <TableCell className="text-muted-foreground">{student.groupName ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{student.credits}</TableCell>
            <TableCell>
              {editingId === student.id ? (
                <Select
                  value={editGradeType}
                  onValueChange={(v) => setEditGradeType(v as GradeType)}
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMERIC">0–100</SelectItem>
                    <SelectItem value="LETTER">A–F</SelectItem>
                    <SelectItem value="ECTS">ECTS</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {student.gradeType === 'ECTS' ? 'ECTS' : student.gradeType === 'LETTER' ? 'A–F' : '0–100'}
                </span>
              )}
            </TableCell>
            <TableCell>
              {editingId === student.id ? (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-8 w-24"
                  data-testid="grade-input"
                />
              ) : (
                <span className="font-semibold">
                  {displayGrade(student.grade, student.gradeType as GradeType)}
                </span>
              )}
            </TableCell>
            <TableCell>
              {editingId === student.id ? (
                <div className="flex gap-1">
                  <Button
                    size="small"
                    variant="primary"
                    onClick={() => handleSave(student)}
                    data-testid="grade-save"
                  >
                    {t('actions.save')}
                  </Button>
                  <Button
                    size="small"
                    variant="tertiary"
                    onClick={() => setEditingId(null)}
                  >
                    {t('actions.cancel')}
                  </Button>
                </div>
              ) : (
                <Button
                  size="small"
                  variant="tertiary"
                  onClick={() => {
                    setEditingId(student.id);
                    setEditValue(String(student.grade));
                    setEditGradeType(student.gradeType as GradeType);
                  }}
                  data-testid="grade-edit"
                >
                  {t('actions.edit')}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
