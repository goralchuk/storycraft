import { auth } from '@/auth';

export async function apiFetch(path: string, init?: RequestInit) {
  const session = await auth();
  const token = (session as { accessToken?: string })?.accessToken;
  return fetch(`${process.env.BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}
