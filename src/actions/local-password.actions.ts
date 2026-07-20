'use server';

import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateInput } from '@/lib/validate';

const passwordResetSchema = z.object({
  identifier: z.string().min(1).max(200),
});

export async function requestPasswordReset(identifier: string) {
  const validated = validateInput(passwordResetSchema, { identifier }, 'requestPasswordReset');
  const normalized = validated.identifier.trim().toLowerCase();

  const rateLimit = checkRateLimit(normalized, 'password-reset', { maxAttempts: 5, windowMs: 60 * 60_000, lockoutMs: 60 * 60_000 });
  if (!rateLimit.allowed) {
    return { ok: false, error: 'rate-limited' as const };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalized },
        { username: normalized },
      ],
    },
  });
  if (!user) {
    return { ok: true as const };
  }

  const resetToken = JWT.sign(
    { userId: user.id, purpose: 'password-reset', tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: '1h', issuer: 'student-portal-local' },
  );

  const resetLink = `/password-reset?token=${resetToken}`;

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Password Reset',
      message: `A password reset was requested for your account. Use this link to reset your password: ${resetLink}`,
      type: 'password-reset',
    },
  });

  return { ok: true as const };
}

const newPasswordSchema = z.object({
  token: z.string().min(1).max(1000),
  newPassword: z.string().min(8).max(128),
});

export async function resetPassword(token: string, newPassword: string) {
  const validated = validateInput(newPasswordSchema, { token, newPassword }, 'resetPassword');

  try {
    const payload = JWT.verify(validated.token, env.JWT_SECRET, { issuer: 'student-portal-local' }) as {
      userId: number;
      purpose: string;
      tokenVersion: number;
    };

    if (payload.purpose !== 'password-reset') {
      return { ok: false, error: 'invalid-token' as const };
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return { ok: false, error: 'invalid-token' as const };
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    return { ok: true as const };
  } catch {
    return { ok: false, error: 'invalid-token' as const };
  }
}
