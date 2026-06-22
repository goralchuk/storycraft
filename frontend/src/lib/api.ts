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

// Parse a JSON response, tolerating an empty body. NestJS returns 200 with an
// empty body when a handler returns null (e.g. GET /books/draft when the user
// has no draft), and Response.json() throws on an empty body.
export async function jsonOrNull<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}
