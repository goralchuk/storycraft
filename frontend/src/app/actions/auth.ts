'use server';
import { signIn, signOut } from '@/auth';

export async function stubLoginAction() {
  await signIn('credentials', { redirectTo: '/dashboard' });
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
