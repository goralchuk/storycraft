import { apiFetch } from './api';

export type PriceItem = {
  key: string;
  label: string;
  category: string;
  amount: number;
  active: boolean;
};

// Pulls the coin price catalog through the Next.js data cache under the
// 'pricing' tag, so screens don't hit the API/DB per request. Invalidated by
// revalidateTag('pricing') on admin updates (see actions/pricing.ts).
export async function getPricing(): Promise<PriceItem[]> {
  const res = await apiFetch('/pricing', { next: { tags: ['pricing'] } });
  if (!res.ok) throw new Error('Failed to load pricing');
  return res.json();
}

export async function getPrice(key: string): Promise<number | undefined> {
  const items = await getPricing();
  return items.find((i) => i.key === key)?.amount;
}
