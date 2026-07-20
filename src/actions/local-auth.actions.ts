'use server';

import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { SID_COOKIE_NAME,TOKEN_COOKIE_NAME } from '@/lib/constants/cookies';
import { env } from '@/lib/env';
import { getModulesForRole } from '@/lib/get-modules-for-role';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { validateInput } from '@/lib/validate';

import type { LocalJWTPayload } from './local-user.actions';
import { generateRefreshToken, revokeAllRefreshTokens } from './refresh-token.actions';

const ACCESS_TOKEN_EXPIRES_IN = '15m';

export async function localLogin(username: string, password: string, rememberMe: boolean) {
  const identifier = username.trim().toLowerCase();

  const rateLimit = checkRateLimit(identifier, 'login', { maxAttempts: 10, windowMs: 60_000, lockoutMs: 5 * 60_000 });
  if (!rateLimit.allowed) {
    return { ok: false, error: 'rate-limited' as const, retryAfterMs: rateLimit.retryAfterMs };
  }

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

  resetRateLimit(identifier, 'login');

  const token = JWT.sign(
    { userId: user.id, username: user.username, role: user.role, modules: getModulesForRole(user.role), schoolId: user.schoolId, tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN, issuer: 'student-portal-local' }
  );

  await generateRefreshToken(user.id, user);

  const sessionId = `local-${user.id}-${Date.now()}`;
  const resolvedCookies = await cookies();
  const isProduction = env.NODE_ENV === 'production';

  const expires = rememberMe ? new Date(Date.now() + 15 * 60 * 1000) : undefined;

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

const registerSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
  role: z.enum(['STUDENT', 'TEACHER']),
  schoolCode: z.string().min(1).max(50),
  faculty: z.string().optional(),
  speciality: z.string().optional(),
});

export async function localRegister(data: {
  fullName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
  schoolCode: string;
  faculty?: string;
  speciality?: string;
}) {
  const validated = validateInput(registerSchema, data, 'localRegister');
  const email = validated.email.trim().toLowerCase();
  const username = email.split('@')[0];
  const schoolCode = validated.schoolCode.trim().toLowerCase();

  const rateLimit = checkRateLimit(email, 'register', { maxAttempts: 5, windowMs: 60 * 60_000, lockoutMs: 60 * 60_000 });
  if (!rateLimit.allowed) {
    return { ok: false, error: 'rate-limited' as const };
  }

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

  const passwordHash = await bcrypt.hash(validated.password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      fullName: validated.fullName,
      role: validated.role,
      schoolId: school.id,
      faculty: validated.faculty || null,
      speciality: validated.speciality || null,
      status: validated.role === 'STUDENT' ? 'Studying' : null,
      studyForm: validated.role === 'STUDENT' ? 'FullTime' : null,
      studyYear: validated.role === 'STUDENT' ? 1 : 0,
      lastActiveAt: new Date(),
    },
  });

  const token = JWT.sign(
    { userId: user.id, username: user.username, role: user.role, modules: getModulesForRole(user.role), schoolId: user.schoolId, tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN, issuer: 'student-portal-local' }
  );

  await generateRefreshToken(user.id, user);

  const sessionId = `local-${user.id}-${Date.now()}`;
  const resolvedCookies = await cookies();
  const isProduction = env.NODE_ENV === 'production';
  const expires = new Date(Date.now() + 15 * 60 * 1000);

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
  const token = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

  if (token) {
    try {
      const payload = JWT.verify(token, env.JWT_SECRET) as LocalJWTPayload;
      await revokeAllRefreshTokens(payload.userId);
    } catch {
      // token invalid, just clear cookies
    }
  }

  resolvedCookies.delete({ domain: env.ROOT_COOKIE_DOMAIN, name: SID_COOKIE_NAME });
  resolvedCookies.delete({ domain: env.MAIN_COOKIE_DOMAIN, name: TOKEN_COOKIE_NAME });
  resolvedCookies.delete({ domain: env.MAIN_COOKIE_DOMAIN, name: 'sp-refresh' });
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
    await revokeAllRefreshTokens(payload.userId);
  } catch {
    return;
  }

  resolvedCookies.delete({ domain: env.ROOT_COOKIE_DOMAIN, name: SID_COOKIE_NAME });
  resolvedCookies.delete({ domain: env.MAIN_COOKIE_DOMAIN, name: TOKEN_COOKIE_NAME });
  resolvedCookies.delete({ domain: env.MAIN_COOKIE_DOMAIN, name: 'sp-refresh' });
  redirect('/');
}
