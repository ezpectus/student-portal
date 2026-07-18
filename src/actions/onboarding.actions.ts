'use server';

import { revalidateTag } from 'next/cache';

import { getLocalUser } from '@/actions/local-auth.actions';
import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';
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
  const user = await getLocalUser();
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
  const user = await getLocalUser();
  if (!user) throw new UnauthorizedError();

  await fileUpload('profile/photo', formData);
  revalidateTag(USER_PROFILE_CACHE_TAG);
}

export async function completeOnboarding() {
  const user = await getLocalUser();
  if (!user) throw new UnauthorizedError();

  revalidateTag(USER_PROFILE_CACHE_TAG);
}
