'use server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export async function updateNameAction(formData: FormData) {
  const name = formData.get('name') as string;
  await apiFetch('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  redirect('/onboarding?step=2');
}

export async function addChildAction(formData: FormData) {
  const name = formData.get('name') as string;
  const birthDate = formData.get('birthDate') as string;
  const gender = formData.get('gender') as string;
  const interestsRaw = formData.get('interests') as string;
  const interests = interestsRaw
    ? interestsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  await apiFetch('/children', {
    method: 'POST',
    body: JSON.stringify({
      name,
      birthDate: birthDate || undefined,
      gender: gender || undefined,
      interests,
    }),
  });
  redirect('/dashboard');
}

export async function skipChildAction() {
  redirect('/dashboard');
}
