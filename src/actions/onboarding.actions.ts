'use server';

import { revalidateTag } from 'next/cache';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';
import { requireCsrf } from '@/lib/csrf';
import { env } from '@/lib/env';
import { UnauthorizedError } from '@/lib/errors';
import { fileUpload } from '@/lib/file-upload';
import { prisma } from '@/lib/prisma';

export async function updateOnboardingProfile(data: {
  faculty?: string;
  speciality?: string;
  groupName?: string;
  studyForm?: string;
  studyYear?: number;
  phone?: string;
  birthDate?: string;
  gradeBookNumber?: string;
}) {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new UnauthorizedError();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      faculty: data.faculty || null,
      speciality: data.speciality || null,
      groupName: data.groupName || null,
      studyForm: data.studyForm || null,
      studyYear: data.studyYear ?? 0,
      phone: data.phone || null,
      birthDate: data.birthDate || null,
      gradeBookNumber: data.gradeBookNumber || null,
    },
  });

  revalidateTag(USER_PROFILE_CACHE_TAG);
}

export async function uploadOnboardingPhoto(formData: FormData) {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new UnauthorizedError();

  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const file = formData.get('file') as File | null;
    if (!file) throw new Error('No file provided');

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { photo: base64 },
    });
  } else {
    await fileUpload('profile/photo', formData);
  }

  revalidateTag(USER_PROFILE_CACHE_TAG);
}

export async function completeOnboarding() {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new UnauthorizedError();

  revalidateTag(USER_PROFILE_CACHE_TAG);
}
