import { NextRequest } from 'next/server';

import { getLocalUser } from '@/actions/local-user.actions';
import { type CsvColumn,csvResponse, toCsv } from '@/lib/csv-export';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getLocalUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  if (type === 'grades') {
    const courses = await prisma.course.findMany({
      where: { userId: user.id },
      select: { name: true, grade: true, gradeType: true, credits: true },
      orderBy: { name: 'asc' },
    });

    const columns: CsvColumn<typeof courses[number]>[] = [
      { header: 'Course', accessor: (r) => r.name },
      { header: 'Grade', accessor: (r) => r.grade },
      { header: 'Grade Type', accessor: (r) => r.gradeType },
      { header: 'Credits', accessor: (r) => r.credits },
    ];

    return csvResponse(toCsv(courses, columns), 'grades.csv');
  }

  if (type === 'attendance') {
    const attendance = await prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { month: 'asc' },
      select: { month: true, present: true, total: true },
    });

    const columns: CsvColumn<typeof attendance[number]>[] = [
      { header: 'Month', accessor: (r) => r.month },
      { header: 'Present', accessor: (r) => r.present },
      { header: 'Total', accessor: (r) => r.total },
      { header: 'Missed', accessor: (r) => r.total - r.present },
    ];

    return csvResponse(toCsv(attendance, columns), 'attendance.csv');
  }

  return new Response('Invalid export type', { status: 400 });
}
