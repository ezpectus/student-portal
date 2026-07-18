'use server';

import { apiFetch } from '@/lib/client';
import { throwApiError } from '@/lib/api-error';
import { Term } from '@/types/models/term';

export async function getTerm() {
  const response = await apiFetch<Term>('/term');
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Term;
}
