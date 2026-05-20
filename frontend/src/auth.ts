import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

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
  ? [Google, stubProvider]
  : [Google];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Google sign-in: exchange for backend JWT
      if (account?.provider === 'google' && profile) {
        const res = await fetch(`${process.env.BACKEND_URL}/auth/google/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleId: profile.sub, email: profile.email, name: profile.name }),
        });
        if (res.ok) {
          const data = (await res.json()) as { access_token: string };
          token.accessToken = data.access_token;
        }
      }
      // Stub sign-in: accessToken already on user object
      if (account?.provider === 'stub' && user && 'accessToken' in user) {
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
