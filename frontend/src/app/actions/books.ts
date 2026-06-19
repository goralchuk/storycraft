'use server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// Step 1 — pay for and create the DRAFT, then land on step 2 (/books/new resumes it).
export async function createDraftAction(formData: FormData) {
  const bookType = formData.get('bookType') as string;
  const templateId = (formData.get('templateId') as string) || undefined;

  const body: Record<string, unknown> = { bookType };
  if (bookType === 'TEMPLATE' && templateId) body.templateId = templateId;

  const res = await apiFetch('/books/draft', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  // 402 = not enough coins; the wallet screen lands later, so bounce to dashboard.
  if (!res.ok) redirect('/dashboard?error=coins');
  redirect('/books/new');
}

// Step 2/3 — save the draft config, then submit it for generation.
export async function submitDraftAction(formData: FormData) {
  const id = formData.get('draftId') as string;
  const childId = formData.get('childId') as string;
  const pageCount = Number(formData.get('pageCount'));

  const patch: Record<string, unknown> = { childId };
  if (Number.isFinite(pageCount)) patch.pageCount = pageCount;

  await apiFetch(`/books/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  const res = await apiFetch(`/books/${id}/submit`, { method: 'POST' });
  // 402 = can't afford the page-tier surcharge; draft is kept.
  if (res.status === 402) redirect('/dashboard?error=coins');
  const book = (await res.json()) as { id: string };
  redirect(`/books/${book.id}`);
}
