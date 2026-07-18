'use server';

import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { TOKEN_COOKIE_NAME, SID_COOKIE_NAME } from '@/lib/constants/cookies';

const JWT_EXPIRES_IN = '7d';

const getModulesForRole = (role: string) => {
  const commonModules = ['studysheet', 'rating', 'certificates', 'announcementseditor'];
  return role === 'ADMIN' ? ['admin', ...commonModules] : commonModules;
};

interface LocalJWTPayload {
  userId: number;
  username: string;
  role: string;
  exp: number;
  modules: string[];
  schoolId: number | null;
  tokenVersion: number;
}

export async function localLogin(username: string, password: string, rememberMe: boolean) {
  const identifier = username.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
  });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  const token = JWT.sign(
    { userId: user.id, username: user.username, role: user.role, modules: getModulesForRole(user.role), schoolId: user.schoolId, tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: 'student-portal-local' }
  );

  const sessionId = `local-${user.id}-${Date.now()}`;
  const resolvedCookies = await cookies();
  const isProduction = env.NODE_ENV === 'production';

  const expires = rememberMe ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined;

  resolvedCookies.set(SID_COOKIE_NAME, sessionId, {
    domain: env.ROOT_COOKIE_DOMAIN,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires,
  });

  resolvedCookies.set(TOKEN_COOKIE_NAME, token, {
    domain: env.MAIN_COOKIE_DOMAIN,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  return true;
}

export async function localRegister(data: {
  fullName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
  schoolCode: string;
  faculty?: string;
  speciality?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const username = email.split('@')[0];
  const schoolCode = data.schoolCode.trim().toLowerCase();

  const [existing, school] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    }),
    prisma.school.findUnique({ where: { slug: schoolCode } }),
  ]);

  if (existing) {
    return { ok: false, error: 'email-taken' as const };
  }

  if (!school) {
    return { ok: false, error: 'school-not-found' as const };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      fullName: data.fullName,
      role: data.role,
      schoolId: school.id,
      faculty: data.faculty || null,
      speciality: data.speciality || null,
      status: data.role === 'STUDENT' ? 'Studying' : null,
      studyForm: data.role === 'STUDENT' ? 'FullTime' : null,
      studyYear: data.role === 'STUDENT' ? 1 : 0,
    },
  });

  const token = JWT.sign(
    { userId: user.id, username: user.username, role: user.role, modules: getModulesForRole(user.role), schoolId: user.schoolId, tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: 'student-portal-local' }
  );

  const sessionId = `local-${user.id}-${Date.now()}`;
  const resolvedCookies = await cookies();
  const isProduction = env.NODE_ENV === 'production';
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  resolvedCookies.set(SID_COOKIE_NAME, sessionId, {
    domain: env.ROOT_COOKIE_DOMAIN,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires,
  });

  resolvedCookies.set(TOKEN_COOKIE_NAME, token, {
    domain: env.MAIN_COOKIE_DOMAIN,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires,
  });

  return { ok: true as const };
}

export async function localLogout() {
  const resolvedCookies = await cookies();
  resolvedCookies.delete({ domain: env.ROOT_COOKIE_DOMAIN, name: SID_COOKIE_NAME });
  resolvedCookies.delete({ domain: env.MAIN_COOKIE_DOMAIN, name: TOKEN_COOKIE_NAME });
  redirect('/');
}

export async function logoutAllDevices() {
  const resolvedCookies = await cookies();
  const token = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) return;

  try {
    const payload = JWT.verify(token, env.JWT_SECRET) as LocalJWTPayload;
    await prisma.user.update({
      where: { id: payload.userId },
      data: { tokenVersion: { increment: 1 } },
    });
  } catch {
    return;
  }

  resolvedCookies.delete({ domain: env.ROOT_COOKIE_DOMAIN, name: SID_COOKIE_NAME });
  resolvedCookies.delete({ domain: env.MAIN_COOKIE_DOMAIN, name: TOKEN_COOKIE_NAME });
  redirect('/');
}

export async function getLocalUser() {
  const resolvedCookies = await cookies();
  const token = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const payload = JWT.verify(token, env.JWT_SECRET) as LocalJWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        school: { select: { id: true, name: true } },
        courses: true,
        attendance: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
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
      courses: user.courses,
      attendance: user.attendance,
      notifications: user.notifications,
      userCategories: [user.role],
      modules: getModulesForRole(user.role),
    };
  } catch {
    return null;
  }
}

export async function getLocalUserById(id: number) {
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

  return user;
}
