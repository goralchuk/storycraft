'use server';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

// Stub top-up: credit a coin package and refresh the wallet (balance + history).
export async function purchasePackAction(key: string) {
  await apiFetch('/coins/purchase', { method: 'POST', body: JSON.stringify({ key }) });
  revalidatePath('/wallet');
}
