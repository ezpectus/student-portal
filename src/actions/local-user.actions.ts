'use server';

import JWT from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { TOKEN_COOKIE_NAME } from '@/lib/constants/cookies';
import { env } from '@/lib/env';
import { getModulesForRole } from '@/lib/get-modules-for-role';
import { prisma } from '@/lib/prisma';

export interface LocalJWTPayload {
  userId: number;
  username: string;
  role: string;
  exp: number;
  modules: string[];
  schoolId: number | null;
  tokenVersion: number;
}

export async function getLocalUser() {
  const resolvedCookies = await cookies();
  const token = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const payload = JWT.verify(token, env.JWT_SECRET) as LocalJWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        photo: true,
        role: true,
        faculty: true,
        speciality: true,
        groupName: true,
        studyForm: true,
        status: true,
        studyYear: true,
        gpa: true,
        phone: true,
        address: true,
        birthDate: true,
        gradeBookNumber: true,
        codeOfHonorSigned: true,
        tokenVersion: true,
        notifyEmail: true,
        notifyAnnouncements: true,
        notifyMessages: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
      },
    });

    if (!user) return null;

    if (payload.tokenVersion !== user.tokenVersion) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      photo: user.photo,
      role: user.role,
      faculty: user.faculty,
      speciality: user.speciality,
      groupName: user.groupName,
      studyForm: user.studyForm,
      status: user.status,
      studyYear: user.studyYear,
      gpa: user.gpa,
      phone: user.phone,
      address: user.address,
      birthDate: user.birthDate,
      gradeBookNumber: user.gradeBookNumber,
      codeOfHonorSigned: user.codeOfHonorSigned,
      schoolId: user.schoolId,
      schoolName: user.school?.name,
      notifyEmail: user.notifyEmail,
      notifyAnnouncements: user.notifyAnnouncements,
      notifyMessages: user.notifyMessages,
      userCategories: [user.role],
      modules: getModulesForRole(user.role),
    };
  } catch {
    return null;
  }
}

export interface LocalUserLite {
  id: number;
  role: string;
  schoolId: number | null;
  tokenVersion: number;
}

export async function getLocalUserLite(): Promise<LocalUserLite | null> {
  const resolvedCookies = await cookies();
  const token = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const payload = JWT.verify(token, env.JWT_SECRET) as LocalJWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, schoolId: true, tokenVersion: true },
    });

    if (!user) return null;
    if (payload.tokenVersion !== user.tokenVersion) return null;

    return user;
  } catch {
    return null;
  }
}

export async function getLocalUserById(id: number) {
  const requester = await getLocalUser();
  if (!requester) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      photo: true,
      role: true,
      faculty: true,
      speciality: true,
      groupName: true,
      studyForm: true,
      status: true,
      studyYear: true,
      gpa: true,
      phone: true,
      address: true,
      birthDate: true,
      gradeBookNumber: true,
      codeOfHonorSigned: true,
      createdAt: true,
      lastActiveAt: true,
      schoolId: true,
      courses: true,
      attendance: true,
    },
  });

  if (!user) return null;

  if (requester.role !== 'ADMIN' && user.schoolId !== requester.schoolId) {
    return null;
  }

  return user;
}
