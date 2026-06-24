'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const heroesPath = (childId: string) => `/children/${childId}/heroes`;

// Hero cards live on both the heroes page and the book wizard's step 2; refresh
// both so generate/topup/add/remove reflect immediately wherever they're used.
function refreshHeroes(childId: string) {
  revalidatePath(heroesPath(childId));
  revalidatePath('/books/new');
}

export async function generateHeroAction(formData: FormData) {
  const childId = formData.get('childId') as string;
  const heroId = formData.get('heroId') as string;
  const description = (formData.get('description') as string)?.trim() || undefined;
  const styleId = (formData.get('styleId') as string) || undefined;

  const res = await apiFetch(`/heroes/${heroId}/generate`, {
    method: 'POST',
    body: JSON.stringify({
      ...(description ? { description } : {}),
      ...(styleId ? { styleId } : {}),
    }),
  });
  if (res.status === 402) redirect(`${heroesPath(childId)}?error=topup`);
  refreshHeroes(childId);
}

export async function addCompanionAction(formData: FormData) {
  const childId = formData.get('childId') as string;
  const role = formData.get('role') as string;
  const name = formData.get('name') as string;

  const res = await apiFetch(heroesPath(childId), {
    method: 'POST',
    body: JSON.stringify({ role, name }),
  });
  if (res.status === 402) redirect('/dashboard?error=coins');
  refreshHeroes(childId);
}

export async function removeHeroAction(formData: FormData) {
  const childId = formData.get('childId') as string;
  const heroId = formData.get('heroId') as string;

  await apiFetch(`/heroes/${heroId}`, { method: 'DELETE' });
  refreshHeroes(childId);
}

export async function topupHeroAction(formData: FormData) {
  const childId = formData.get('childId') as string;
  const heroId = formData.get('heroId') as string;

  const res = await apiFetch(`/heroes/${heroId}/topup`, { method: 'POST' });
  if (res.status === 402) redirect('/dashboard?error=coins');
  refreshHeroes(childId);
}
