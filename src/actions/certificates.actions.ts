'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import qs from 'query-string';

import { apiFetch } from '@/lib/client';
import { throwApiError } from '@/lib/api-error';
import { CERTIFICATES_CACHE_TAG } from '@/lib/constants/cache-tags';
import { parseContentDispositionFilename } from '@/lib/utils';
import { Certificate } from '@/types/models/certificate/certificate';
import { CertificateVerificationResult } from '@/types/models/certificate/certificate-verification-result';
import { CertificateStatus } from '@/types/models/certificate/status';

export async function getCertificateTypes() {
  const response = await apiFetch<string[]>('/certificates/types', {
    next: { revalidate: 3600, tags: [CERTIFICATES_CACHE_TAG] },
  });
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as string[];
}
export type UpdateCertificateBody = {
  approve: boolean;
  reason?: string;
};

export async function updateCertificate(id: number, body: UpdateCertificateBody) {
  const res = await apiFetch(`/certificates/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ ...body }),
  });

  if (!res.ok) {
    throwApiError(res.status, 'updateCertificate');
  }
  revalidateTag(CERTIFICATES_CACHE_TAG);
  revalidatePath('/module/facultycertificate', 'layout');
}
type CertificateRequestBody = {
  type: string;
  originalRequired?: boolean;
  notes?: string;
  purpose?: string;
};

export async function createCertificateRequest(body: CertificateRequestBody) {
  const response = await apiFetch('/certificates', {
    method: 'POST',
    body: JSON.stringify({ ...body }),
  });

  if (!response.ok) {
    throwApiError(response.status);
  }

  revalidateTag(CERTIFICATES_CACHE_TAG);
  revalidatePath('/module/certificates');
}

export async function getCertificateList() {
  const response = await apiFetch<Certificate[]>('/certificates', {
    next: { revalidate: 300, tags: [CERTIFICATES_CACHE_TAG] },
  });
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Certificate[];
}

export async function getAllFacultyCertificates(query: FacultyCertificatesQuery = {}) {
  const queryParams = qs.stringify(query);
  const res = await apiFetch<Certificate[]>(`/certificates/all?${queryParams}`, {
    next: { revalidate: 300, tags: [CERTIFICATES_CACHE_TAG] },
  });
  if (!res.ok) {
    throwApiError(res.status);
  }
  const allCertificates = (await res.json()) as Certificate[];

  const totalCount = parseInt(res.headers.get('x-total-count') || '0', 10);
  return { allCertificates, totalCount };
}

export async function getCertificatePDF(id: number) {
  const response = await apiFetch(`/certificates/${id}/pdf`, {
    headers: {
      Accept: 'application/pdf',
    },
  });

  if (!response.ok) {
    throwApiError(response.status, 'getCertificatePDF');
  }

  const cd = response.headers.get('Content-Disposition') || '';
  const filename = parseContentDispositionFilename(cd) ?? `certificate.pdf`;
  const blob = await response.blob();

  return {
    filename,
    blob,
  };
}

export async function getCertificate(id: number) {
  const res = await apiFetch<Certificate>(`/certificates/${id}`, {
    next: { revalidate: 300, tags: [CERTIFICATES_CACHE_TAG] },
  });
  if (!res.ok) {
    throwApiError(res.status);
  }
  return (await res.json()) as Certificate;
}

export async function verifyCertificate(id: string) {
  const response = await apiFetch<CertificateVerificationResult>(`/certificates/validate/${id}`);
  if (!response.ok) {
    return 'error';
  }

  return (await response.json()) as CertificateVerificationResult;
}

export interface FacultyCertificatesQuery {
  page?: string;
  size?: string;
  filter?: string;
  status?: string;
}

export async function getOtherFacultyCertificate() {
  const res = await apiFetch<Certificate[]>('/certificates/all', {
    next: { revalidate: 300, tags: [CERTIFICATES_CACHE_TAG] },
  });

  if (!res.ok) {
    throwApiError(res.status);
  }

  const data = (await res.json()) as Certificate[];

  const rejectedCertificates: Certificate[] = [];
  const approvedCertificates: Certificate[] = [];
  const createdCertificates: Certificate[] = [];

  for (const item of data) {
    if (item.approved === false) {
      rejectedCertificates.push(item);
    } else if (item.approved === true && item.status === CertificateStatus.Processed) {
      approvedCertificates.push(item);
    } else if (item.approved === null && item.status === CertificateStatus.Created) {
      createdCertificates.push(item);
    }
  }

  return { rejectedCertificates, approvedCertificates, createdCertificates };
}

export async function signCertificate(id: number) {
  const response = await apiFetch(`/certificates/${id}/signed`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throwApiError(response.status);
  }

  revalidateTag(CERTIFICATES_CACHE_TAG);
  revalidatePath('/module/facultycertificate', 'layout');
}
