import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

type DbUser = { id: string; email: string; name: string | null };

async function fetchDbUser(token: string): Promise<DbUser | null> {
  const res = await fetch(`${process.env.BACKEND_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<DbUser>;
}

const backendCallbackProvider = Credentials({
  id: 'backend-callback',
  name: 'Backend Callback',
  credentials: { token: { type: 'text' } },
  authorize: async ({ token }) => {
    if (!token) return null;
    const user = await fetchDbUser(token as string);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, accessToken: token };
  },
});

const stubProvider = Credentials({
  id: 'stub',
  name: 'Stub (dev)',
  credentials: {},
  authorize: async () => {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/stub-login`, { method: 'POST' });
    if (!res.ok) return null;
    const { access_token } = (await res.json()) as { access_token: string };
    const user = await fetchDbUser(access_token);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, accessToken: access_token };
  },
});

const providers = process.env.STUB_AUTH === 'true'
  ? [backendCallbackProvider, stubProvider]
  : [backendCallbackProvider];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        if ('accessToken' in user) token.accessToken = user.accessToken as string;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = token.name as string | null;
      (session as { accessToken?: string }).accessToken = token.accessToken as string;
      return session;
    },
  },
});
