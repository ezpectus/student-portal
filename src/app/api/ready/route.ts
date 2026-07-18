import { NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { getCircuitState } from '@/lib/circuit-breaker';
import { prisma } from '@/lib/prisma';

type CheckResult = {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  detail?: string;
};

const checkDatabase = async (): Promise<CheckResult> => {
  if (env.NEXT_PUBLIC_LOCAL_AUTH !== 'true') {
    return { name: 'database', status: 'healthy', detail: 'skipped (remote auth mode)' };
  }

  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { name: 'database', status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      detail: error instanceof Error ? error.message : 'unknown error',
    };
  }
};

const checkExternalApi = async (): Promise<CheckResult> => {
  const circuitState = getCircuitState('external-api');
  if (circuitState === 'open') {
    return {
      name: 'external-api',
      status: 'unhealthy',
      detail: 'circuit breaker open',
    };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(env.API_BASE_URL, {
      signal: controller.signal,
      method: 'HEAD',
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (response.ok || response.status === 401 || response.status === 404) {
      return { name: 'external-api', status: 'healthy', latencyMs };
    }
    if (response.status >= 500) {
      return { name: 'external-api', status: 'unhealthy', latencyMs, detail: `HTTP ${response.status}` };
    }
    return { name: 'external-api', status: 'healthy', latencyMs };
  } catch (error) {
    return {
      name: 'external-api',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      detail: error instanceof Error ? error.message : 'connection failed',
    };
  }
};

export async function GET() {
  const [dbResult, apiResult] = await Promise.all([checkDatabase(), checkExternalApi()]);
  const checks = [dbResult, apiResult];

  const allHealthy = checks.every((c) => c.status === 'healthy');
  const anyUnhealthy = checks.some((c) => c.status === 'unhealthy');

  const overallStatus = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';
  const httpStatus = allHealthy ? 200 : anyUnhealthy ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: httpStatus },
  );
}
