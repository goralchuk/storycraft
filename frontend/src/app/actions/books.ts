'use server';
import { revalidatePath } from 'next/cache';
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

// Step 2 — pick the main child; persisted at once so the main hero resolves and
// heroes become generatable. Refreshes the wizard to load that child's heroes.
export async function saveChildAction(formData: FormData) {
  const id = formData.get('draftId') as string;
  const childId = formData.get('childId') as string;

  await apiFetch(`/books/${id}`, { method: 'PATCH', body: JSON.stringify({ childId }) });
  revalidatePath('/books/new');
}

// Step 2/3 — save the draft config, then submit it for generation.
export async function submitDraftAction(formData: FormData) {
  const id = formData.get('draftId') as string;
  const childId = formData.get('childId') as string;
  const pageCount = Number(formData.get('pageCount'));
  const writingStyle = (formData.get('writingStyle') as string) || undefined;
  const topicId = (formData.get('topicId') as string) || undefined;
  const promptText = formData.get('promptText') as string | null;

  const patch: Record<string, unknown> = { childId };
  if (Number.isFinite(pageCount)) patch.pageCount = pageCount;
  if (writingStyle) patch.writingStyle = writingStyle;
  if (topicId) patch.topicId = topicId;
  if (promptText !== null) patch.promptText = promptText;

  await apiFetch(`/books/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  const res = await apiFetch(`/books/${id}/submit`, { method: 'POST' });
  // 402 = can't afford the page-tier surcharge; draft is kept.
  if (res.status === 402) redirect('/dashboard?error=coins');
  const book = (await res.json()) as { id: string };
  redirect(`/books/${book.id}`);
}
