'use server';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { AttestationResult } from '@/types/models/attestation-results/attestation-result';

export async function getAttestationResults() {
  const response = await apiFetch('/attestation');
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as AttestationResult[];
}
