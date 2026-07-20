'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { env } from '@/lib/env';
import { Term } from '@/types/models/term';

export async function getTerm() {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    return { disciplines: [], averageScore: 0 } as unknown as Term;
  }

  const response = await apiFetch('/term');
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Term;
}
