'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { env } from '@/lib/env';
import { CreditModule } from '@/types/models/current-control/credit-module';
import { Sheet } from '@/types/models/current-control/sheet';

export async function getMonitoring(): Promise<Sheet> {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    return { disciplines: [], studyYears: [] } as unknown as Sheet;
  }

  const response = await apiFetch('monitoring');

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Sheet;
}

export async function getMonitoringById(id: string): Promise<CreditModule> {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    return {} as unknown as CreditModule;
  }

  const response = await apiFetch(`monitoring/${id}`);

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as CreditModule;
}
