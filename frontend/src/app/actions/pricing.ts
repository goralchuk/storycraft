'use server';
import { updateTag } from 'next/cache';
import { apiFetch } from '@/lib/api';

// Admin-only: update a coin price, then refresh the cached catalog so every
// screen reading getPricing() picks up the new amount. updateTag gives
// read-your-own-writes semantics for the calling Server Action.
export async function updatePriceAction(key: string, amount: number) {
  const res = await apiFetch(`/pricing/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error('Failed to update price');
  updateTag('pricing');
  return res.json();
}
