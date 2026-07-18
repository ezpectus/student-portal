'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { z } from 'zod';

import { apiFetch } from '@/lib/client';
import { throwApiError } from '@/lib/api-error';
import { validateInput } from '@/lib/validate';
import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';
import { Contact, ContactType } from '@/types/models/contact';

/**
 * @returns Safe default on error: []. Never throws.
 */
export async function getContacts() {
  try {
    const response = await apiFetch<Contact[]>('profile/contacts', {
      next: { revalidate: 300, tags: [USER_PROFILE_CACHE_TAG] },
    });

    if (!response.ok) return [];
    return (await response.json()) as Contact[];
  } catch {
    return [];
  }
}

/**
 * @returns Safe default on error: []. Never throws.
 */
export async function getContactTypes() {
  try {
    const response = await apiFetch<ContactType[]>('profile/contacts/types', {
      next: { revalidate: 3600, tags: [USER_PROFILE_CACHE_TAG] },
    });

    if (!response.ok) return [];
    return (await response.json()) as ContactType[];
  } catch {
    return [];
  }
}

const createContactSchema = z.object({
  typeId: z.number().int().positive(),
  value: z.string().min(1).max(500),
});

/**
 * @throws {ValidationError} If typeId or value are invalid.
 * @throws {ActionError} On API failure.
 */
export async function createContact(typeId: number, value: string) {
  const validated = validateInput(createContactSchema, { typeId, value }, 'createContact');

  const response = await apiFetch('profile/contacts', {
    method: 'POST',
    body: JSON.stringify({ typeId: validated.typeId, value: validated.value }),
  });

  if (!response.ok) {
    throwApiError(response.status, 'createContact');
  }

  revalidateTag(USER_PROFILE_CACHE_TAG);
}

const updateContactSchema = z.object({
  id: z.number().int().positive(),
  typeId: z.number().int().positive(),
  value: z.string().min(1).max(500),
});

/**
 * @throws {ValidationError} If id, typeId, or value are invalid.
 * @throws {ActionError} On API failure.
 */
export async function updateContact(id: number, typeId: number, value: string) {
  const validated = validateInput(updateContactSchema, { id, typeId, value }, 'updateContact');

  const response = await apiFetch(`profile/contacts/${validated.id}`, {
    method: 'PUT',
    body: JSON.stringify({ typeId: validated.typeId, value: validated.value }),
  });

  if (!response.ok) {
    throwApiError(response.status, 'updateContact');
  }

  revalidateTag(USER_PROFILE_CACHE_TAG);
}

const deleteContactSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * @throws {ValidationError} If id is invalid.
 * @throws {ActionError} On API failure.
 */
export async function deleteContact(id: number) {
  const validated = validateInput(deleteContactSchema, { id }, 'deleteContact');

  const response = await apiFetch(`profile/contacts/${validated.id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throwApiError(response.status, 'deleteContact');
  }

  revalidateTag(USER_PROFILE_CACHE_TAG);
}

const intellectInfoSchema = z.object({
  credo: z.string().max(1000),
  scientificInterests: z.string().max(2000),
});

/**
 * @throws {ValidationError} If credo or scientificInterests exceed limits.
 * @throws {ActionError} On API failure.
 */
export async function updateIntellectInfo(credo: string, scientificInterests: string) {
  const validated = validateInput(intellectInfoSchema, { credo, scientificInterests }, 'updateIntellectInfo');

  const response = await apiFetch('profile/intellect', {
    method: 'PUT',
    body: JSON.stringify({ credo: validated.credo, scientificInterests: validated.scientificInterests }),
  });

  if (!response.ok) {
    throwApiError(response.status, 'updateIntellectInfo');
  }
  revalidateTag(USER_PROFILE_CACHE_TAG);
}

export async function acceptCodeOfHonor() {
  const response = await apiFetch('profile/code-of-honor', {
    method: 'PUT',
  });

  if (!response.ok) {
    throwApiError(response.status, 'acceptCodeOfHonor');
  }
  redirect('/');
}

export async function acceptPrivacyConsent() {
  const response = await apiFetch('profile/privacy-consent', {
    method: 'POST',
  });

  if (!response.ok) {
    throwApiError(response.status, 'acceptPrivacyConsent');
  }
  revalidateTag(USER_PROFILE_CACHE_TAG);
}
