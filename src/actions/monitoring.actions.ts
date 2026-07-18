'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { CreditModule } from '@/types/models/current-control/credit-module';
import { Sheet } from '@/types/models/current-control/sheet';

export async function getMonitoring(): Promise<Sheet> {
  const response = await apiFetch('monitoring');

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Sheet;
}

export async function getMonitoringById(id: string): Promise<CreditModule> {
  const response = await apiFetch(`monitoring/${id}`);

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as CreditModule;
}
