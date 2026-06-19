'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';

function parseInterests(raw: string | null): string[] {
  return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function childBody(formData: FormData) {
  const birthDate = formData.get('birthDate') as string;
  const gender = formData.get('gender') as string;
  return {
    name: formData.get('name') as string,
    birthDate: birthDate || undefined,
    gender: gender || undefined,
    interests: parseInterests(formData.get('interests') as string),
  };
}

export async function createChildAction(formData: FormData) {
  await apiFetch('/children', { method: 'POST', body: JSON.stringify(childBody(formData)) });
  revalidatePath('/children');
  redirect('/children');
}

export async function updateChildAction(formData: FormData) {
  const id = formData.get('id') as string;
  await apiFetch(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(childBody(formData)) });
  revalidatePath('/children');
  redirect('/children');
}

export async function deleteChildAction(formData: FormData) {
  const id = formData.get('id') as string;
  const res = await apiFetch(`/children/${id}`, { method: 'DELETE' });
  // 409 = child still has books and cannot be deleted.
  if (res.status === 409) redirect('/children?error=hasbooks');
  revalidatePath('/children');
  redirect('/children');
}

// Multipart upload can't go through apiFetch (it forces JSON), so post directly
// with the Bearer token, then persist the returned URL as the child's photoUrl.
export async function uploadChildPhotoAction(formData: FormData) {
  const id = formData.get('id') as string;
  const file = formData.get('file') as File;
  if (!file || file.size === 0) redirect('/children');

  const session = await auth();
  const token = (session as { accessToken?: string })?.accessToken;

  const upload = new FormData();
  upload.append('file', file);
  const res = await fetch(`${process.env.BACKEND_URL}/uploads/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: upload,
  });
  if (!res.ok) redirect('/children?error=upload');
  const { url } = (await res.json()) as { url: string };

  await apiFetch(`/children/${id}`, { method: 'PATCH', body: JSON.stringify({ photoUrl: url }) });
  revalidatePath('/children');
  redirect('/children');
}
