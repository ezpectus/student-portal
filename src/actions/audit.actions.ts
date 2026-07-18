'use server';

import { prisma } from '@/lib/prisma';
import { getLocalUser } from '@/actions/local-auth.actions';

export async function getAuditLogs(page: number = 1, pageSize: number = 20) {
  const user = await getLocalUser();
  if (!user || user.role !== 'ADMIN') {
    return { items: [], total: 0 };
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: {
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);

  return { items, total };
}

export async function logAuditEvent(params: {
  action: string;
  entity: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const user = await getLocalUser();
  if (!user) return;

  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress,
      userId: user.id,
    },
  });
}
