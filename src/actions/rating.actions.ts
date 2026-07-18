'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { RatingData } from '@/types/models/rating';

export async function getRatingData(): Promise<RatingData> {
  const response = await apiFetch('/rating/data');

  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as RatingData;
}
