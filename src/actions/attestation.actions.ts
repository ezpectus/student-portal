'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { env } from '@/lib/env';
import { AttestationResult } from '@/types/models/attestation-results/attestation-result';

export async function getAttestationResults() {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    return [];
  }

  const response = await apiFetch('/attestation');
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as AttestationResult[];
}
