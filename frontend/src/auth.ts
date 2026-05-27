import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const backendCallbackProvider = Credentials({
  id: 'backend-callback',
  name: 'Backend Callback',
  credentials: { token: { type: 'text' } },
  authorize: async ({ token }) => {
    if (!token) return null;
    const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { sub: string; email: string };
    return { id: user.sub, email: user.email, accessToken: token };
  },
});

const stubProvider = Credentials({
  id: 'stub',
  name: 'Stub (dev)',
  credentials: {},
  authorize: async () => {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/stub-login`, { method: 'POST' });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; user: { id: string; email: string; name: string } };
    return { id: data.user.id, email: data.user.email, name: data.user.name, accessToken: data.access_token };
  },
});

const providers = process.env.STUB_AUTH === 'true'
  ? [backendCallbackProvider, stubProvider]
  : [backendCallbackProvider];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'accessToken' in user) {
        token.accessToken = user.accessToken as string;
      }
      return token;
    },
    session({ session, token }) {
      (session as { accessToken?: string }).accessToken = token.accessToken as string;
      return session;
    },
  },
});
