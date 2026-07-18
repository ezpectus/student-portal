'use server';

import { apiFetch } from '@/lib/client';
import { throwApiError } from '@/lib/api-error';
import { Sheet } from '@/types/models/current-control/sheet';
import { CreditModule } from '@/types/models/current-control/credit-module';

export async function getMonitoring(): Promise<Sheet> {
  const response = await apiFetch<Sheet>('monitoring');

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Sheet;
}

export async function getMonitoringById(id: string): Promise<CreditModule> {
  const response = await apiFetch<CreditModule>(`monitoring/${id}`);

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as CreditModule;
}
