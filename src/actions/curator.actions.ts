'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { Curator } from '@/types/models/curator';

export async function getCurator(): Promise<Curator | null> {
  const response = await apiFetch('/curator');
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Curator;
}
