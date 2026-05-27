'use server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export async function createBookAction(formData: FormData) {
  const templateId = formData.get('templateId') as string;
  const childId = formData.get('childId') as string;
  await apiFetch('/books', {
    method: 'POST',
    body: JSON.stringify({ templateId, childId }),
  });
  redirect('/dashboard');
}
