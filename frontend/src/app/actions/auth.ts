'use server';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';

export async function googleLoginAction() {
  redirect(`${process.env.BACKEND_URL}/auth/google`);
}

export async function stubLoginAction() {
  await signIn('stub', { redirectTo: '/dashboard' });
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
