'use server';

import { getLocalUser } from '@/actions/local-user.actions';
import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { RatingData } from '@/types/models/rating';

export async function getRatingData(): Promise<RatingData> {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const user = await getLocalUser();
    if (!user) return { years: {} };

    try {
      const courses = await prisma.course.findMany({
        where: { userId: user.id },
        select: { name: true, grade: true, credits: true, gradeType: true },
        orderBy: { name: 'asc' },
      });

      const totalResult = courses.reduce((sum, c) => sum + c.grade * c.credits, 0);
      const totalEntryCount = courses.length;

      return {
        years: {
          [String(user.studyYear || 1)]: [
            {
              workPlace: { id: 0, name: user.faculty ?? '—' },
              summary: [
                {
                  employeeId: user.id,
                  subdivisionName: user.speciality ?? '—',
                  workKindId: 0,
                  workKindName: 'Rating',
                  sumResult: Math.round(totalResult),
                  entryCount: totalEntryCount,
                },
              ],
              entries: courses.map((c, i) => ({
                ratingTextId: i,
                employeeId: user.id,
                subdivisionName: user.speciality ?? '—',
                studyingYearId: user.studyYear ?? 1,
                text: c.name,
                textFull: c.name,
                time: 0,
                quantity: c.credits,
                quantityPercent: 0,
                result: Math.round(c.grade * c.credits),
                status: 1,
                markId: 0,
                mark: Math.round(c.grade),
                loadId: 0,
                loadSubTreeNumber: 0,
                loadName: c.name,
                loadStatus: 1,
                treeId: 0,
                treeSubTreeNumber: 0,
                treeName: c.name,
                workKindId: 0,
                workKindSubTreeNumber: 0,
                workKindName: 'Course',
              })),
              totalResult: Math.round(totalResult),
              totalEntryCount,
            },
          ],
        },
      };
    } catch {
      return { years: {} };
    }
  }

  const response = await apiFetch('/rating/data');

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as RatingData;
}
