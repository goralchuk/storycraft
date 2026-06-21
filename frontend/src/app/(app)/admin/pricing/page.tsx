import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { getPricing } from '@/lib/pricing';
import PriceEditor, { type PriceItem } from './PriceEditor';

export default async function AdminPricingPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const meRes = await apiFetch('/users/me');
  const me = (meRes.ok ? await meRes.json() : { role: 'USER' }) as { role: string };
  if (me.role !== 'ADMIN') redirect('/dashboard');

  const items = (await getPricing()) as PriceItem[];

  return (
    <main className="mx-auto max-w-[720px] px-10 pt-10 pb-[90px]">
      <h1 className="font-display text-[34px] font-extrabold">Расценки</h1>
      <p className="mt-[7px] mb-7 text-base text-muted">
        Стоимости в монетах. Изменения применяются сразу — для всех экранов и списаний.
      </p>
      <PriceEditor items={items} />
    </main>
  );
}
