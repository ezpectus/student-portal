'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { Term } from '@/types/models/term';

export async function getTerm() {
  const response = await apiFetch('/term');
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Term;
}
