'use server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export async function createBookAction(formData: FormData) {
  const templateId = formData.get('templateId') as string;
  const childId = formData.get('childId') as string;
  const pageCount = Number(formData.get('pageCount'));

  const body: Record<string, unknown> = { templateId, childId };
  if (Number.isFinite(pageCount)) body.pageCount = pageCount;

  const res = await apiFetch('/books', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const book = (await res.json()) as { id: string };
  redirect(`/books/${book.id}`);
}
