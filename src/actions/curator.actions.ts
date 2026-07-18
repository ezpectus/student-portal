'use server';

import { apiFetch } from '@/lib/client';
import { throwApiError } from '@/lib/api-error';
import { Curator } from '@/types/models/curator';

export async function getCurator(): Promise<Curator | null> {
  const response = await apiFetch<Curator>('/curator');
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Curator;
}
