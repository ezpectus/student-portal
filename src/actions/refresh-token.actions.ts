'use server';

import JWT from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { TOKEN_COOKIE_NAME } from '@/lib/constants/cookies';
import { env } from '@/lib/env';
import { getModulesForRole } from '@/lib/get-modules-for-role';
import { prisma } from '@/lib/prisma';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const REFRESH_COOKIE_NAME = 'sp-refresh';

interface LocalJWTPayload {
  userId: number;
  username: string;
  role: string;
  modules: string[];
  schoolId: number | null;
  tokenVersion: number;
}

function signAccessToken(payload: LocalJWTPayload): string {
  return JWT.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'student-portal-local',
  });
}

function signRefreshToken(userId: number, tokenVersion: number): string {
  return JWT.sign({ userId, tokenVersion, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'student-portal-local',
  });
}

export async function generateRefreshToken(userId: number, user: { id: number; username: string; role: string; schoolId: number | null; tokenVersion: number }) {
  const token = signRefreshToken(userId, user.tokenVersion);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const resolvedCookies = await cookies();
  const isProduction = env.NODE_ENV === 'production';

  resolvedCookies.set(REFRESH_COOKIE_NAME, token, {
    domain: env.MAIN_COOKIE_DOMAIN,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: expiresAt,
  });

  return token;
}

export async function refreshAccessToken(): Promise<{ ok: boolean; error?: string }> {
  const resolvedCookies = await cookies();
  const refreshToken = resolvedCookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return { ok: false, error: 'no-refresh-token' };
  }

  try {
    const decoded = JWT.verify(refreshToken, env.JWT_SECRET, {
      issuer: 'student-portal-local',
    }) as { userId: number; tokenVersion: number; type: string };

    if (decoded.type !== 'refresh') {
      return { ok: false, error: 'invalid-token-type' };
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return { ok: false, error: 'token-revoked-or-expired' };
    }

    if (storedToken.user.tokenVersion !== decoded.tokenVersion) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      return { ok: false, error: 'token-version-mismatch' };
    }

    const newAccessToken = signAccessToken({
      userId: storedToken.user.id,
      username: storedToken.user.username,
      role: storedToken.user.role,
      modules: getModulesForRole(storedToken.user.role),
      schoolId: storedToken.user.schoolId,
      tokenVersion: storedToken.user.tokenVersion,
    });

    const newRefreshToken = signRefreshToken(storedToken.user.id, storedToken.user.tokenVersion);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedBy: newRefreshToken,
      },
    });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: newExpiresAt,
      },
    });

    const isProduction = env.NODE_ENV === 'production';

    resolvedCookies.set(TOKEN_COOKIE_NAME, newAccessToken, {
      domain: env.MAIN_COOKIE_DOMAIN,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    });

    resolvedCookies.set(REFRESH_COOKIE_NAME, newRefreshToken, {
      domain: env.MAIN_COOKIE_DOMAIN,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: newExpiresAt,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: 'invalid-refresh-token' };
  }
}

export async function revokeAllRefreshTokens(userId: number) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function cleanupExpiredRefreshTokens() {
  await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });
}

