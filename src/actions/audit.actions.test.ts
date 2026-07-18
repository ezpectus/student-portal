import { beforeEach,describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/actions/local-auth.actions', () => ({
  getLocalUser: vi.fn(),
}));

import { getAuditLogs, logAuditEvent } from '@/actions/audit.actions';
import { getLocalUser } from '@/actions/local-auth.actions';
import { prisma } from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma);
const mockGetLocalUser = vi.mocked(getLocalUser);

describe('getAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty result when user is not logged in', async () => {
    mockGetLocalUser.mockResolvedValue(null);

    const result = await getAuditLogs();

    expect(result).toEqual({ items: [], total: 0 });
    expect(mockPrisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it('returns empty result when user is not admin', async () => {
    mockGetLocalUser.mockResolvedValue({ id: 1, role: 'STUDENT' } as never);

    const result = await getAuditLogs();

    expect(result).toEqual({ items: [], total: 0 });
    expect(mockPrisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it('fetches paginated audit logs for admin user', async () => {
    mockGetLocalUser.mockResolvedValue({ id: 1, role: 'ADMIN' } as never);
    mockPrisma.auditLog.findMany.mockResolvedValue([
      { id: 1, action: 'login', entity: 'User', userId: 1, user: { id: 1, fullName: 'Admin', username: 'admin', email: 'admin@test.com' } },
    ] as never);
    mockPrisma.auditLog.count.mockResolvedValue(1 as never);

    const result = await getAuditLogs(1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('calculates correct skip for page 2', async () => {
    mockGetLocalUser.mockResolvedValue({ id: 1, role: 'ADMIN' } as never);
    mockPrisma.auditLog.findMany.mockResolvedValue([] as never);
    mockPrisma.auditLog.count.mockResolvedValue(0 as never);

    await getAuditLogs(2, 20);

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20 }),
    );
  });
});

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when user is not logged in', async () => {
    mockGetLocalUser.mockResolvedValue(null);

    await logAuditEvent({ action: 'login', entity: 'User' });

    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('creates audit log entry with correct data', async () => {
    mockGetLocalUser.mockResolvedValue({ id: 5, role: 'STUDENT' } as never);
    mockPrisma.auditLog.create.mockResolvedValue({} as never);

    await logAuditEvent({
      action: 'change_email',
      entity: 'User',
      entityId: 5,
      ipAddress: '127.0.0.1',
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'change_email',
        entity: 'User',
        entityId: 5,
        metadata: null,
        ipAddress: '127.0.0.1',
        userId: 5,
      },
    });
  });

  it('serializes metadata to JSON string', async () => {
    mockGetLocalUser.mockResolvedValue({ id: 1, role: 'ADMIN' } as never);
    mockPrisma.auditLog.create.mockResolvedValue({} as never);

    const metadata = { oldEmail: 'old@test.com', newEmail: 'new@test.com' };

    await logAuditEvent({
      action: 'change_email',
      entity: 'User',
      metadata,
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: JSON.stringify(metadata),
      }),
    });
  });

  it('passes null metadata when not provided', async () => {
    mockGetLocalUser.mockResolvedValue({ id: 1, role: 'ADMIN' } as never);
    mockPrisma.auditLog.create.mockResolvedValue({} as never);

    await logAuditEvent({ action: 'login', entity: 'User' });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: null,
        entityId: undefined,
        ipAddress: undefined,
      }),
    });
  });
});
