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

// Step 2 — save the draft config (no charge) and advance to the step-3 screen.
// Generation itself starts on step 3 via generateBookAction.
export async function saveDraftAction(formData: FormData) {
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
  redirect(`/books/${id}`);
}

// Step 3 — start generation: charges the page-tier surcharge and enqueues. Keeps
// the draft on 402; otherwise the page (re)renders the in-progress state.
export async function generateBookAction(formData: FormData) {
  const id = formData.get('bookId') as string;

  const res = await apiFetch(`/books/${id}/submit`, { method: 'POST' });
  if (res.status === 402) redirect('/dashboard?error=coins');
  revalidatePath(`/books/${id}`);
}
