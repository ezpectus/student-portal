'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { TOKEN_COOKIE_NAME } from './constants/cookies';
import { env } from './env';

const FileUpload = (basePath: string) => {
  return async (url: string | URL, formData: FormData) => {
    const resolvedCookies = await cookies();
    const jwt = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

    if (!jwt) {
      redirect('/');
    }

    const input = new URL(url, basePath).href;

    const response = await fetch(input, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      body: formData,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (response.status === 401) {
      resolvedCookies.delete(TOKEN_COOKIE_NAME);
      redirect('/');
    }

    if (!response.ok) {
      throw new Error('Error uploading file.');
    }
  };
};

export const fileUpload = FileUpload(env.API_BASE_URL);
