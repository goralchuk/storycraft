import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { getPricing } from '@/lib/pricing';
import PackageGrid, { type Pack } from './PackageGrid';

type Transaction = {
  id: string;
  label: string;
  amount: number;
  isIn: boolean;
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function WalletPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [meRes, txRes, pricing] = await Promise.all([
    apiFetch('/users/me'),
    apiFetch('/coins/transactions', { cache: 'no-store' }),
    getPricing(),
  ]);
  const me = (meRes.ok ? await meRes.json() : { balance: 0 }) as { balance: number };
  const transactions = (txRes.ok ? await txRes.json() : []) as Transaction[];
  const packages = pricing
    .filter((p) => p.category === 'PACK' && p.active)
    .map((p): Pack => ({ key: p.key, amount: p.amount }))
    .sort((a, b) => a.amount - b.amount);

  return (
    <main className="mx-auto max-w-[1080px] px-10 pt-10 pb-[90px]">
      <h1 className="font-display text-[34px] font-extrabold">Кошелёк</h1>
      <p className="mt-[7px] mb-7 text-base text-muted">
        Монеты нужны для генерации книг. Покупайте их или зарабатывайте на акциях.
      </p>

      {/* balance + bonus */}
      <div className="mb-9 grid grid-cols-1 gap-5 md:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden rounded-[26px] bg-ink px-9 py-[34px]">
          <div className="absolute -top-10 -right-2.5 h-[170px] w-[170px] rounded-full bg-primary/30" />
          <div className="absolute -bottom-12 right-[120px] h-[110px] w-[110px] rounded-full bg-pink/25" />
          <div className="relative">
            <div className="text-[15px] font-bold text-[#d8cdc4]">Баланс на счету</div>
            <div className="my-2.5 flex items-end gap-3">
              <span className="text-[44px] leading-none">🪙</span>
              <span className="font-display text-[54px] font-extrabold leading-none text-white">{me.balance}</span>
              <span className="pb-1.5 font-display text-xl font-bold text-[#d8cdc4]">монет</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-[18px] text-sm font-semibold text-[#e8d9cd]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />Уникальная книга · 500 🪙
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green" />По шаблону · 300 🪙
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2.5 rounded-[26px] border border-border bg-surface p-7 shadow-card">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-green-soft text-2xl">🎁</div>
          <h3 className="mt-1.5 font-display text-[19px] font-bold">Стартовый бонус</h3>
          <p className="text-sm leading-relaxed text-muted">
            Новым пользователям мы начислили <b className="text-ink">500 монет</b> — этого хватит на первую книгу.
            Приятного творчества!
          </p>
        </div>
      </div>

      {/* packages */}
      <h2 className="mb-4 font-display text-[23px] font-extrabold">Пополнить баланс</h2>
      {packages.length > 0 ? (
        <PackageGrid packages={packages} />
      ) : (
        <p className="text-sm text-muted">Пакеты пока недоступны.</p>
      )}

      {/* history */}
      <h2 className="mt-10 mb-4 font-display text-[23px] font-extrabold">История операций</h2>
      <div className="rounded-[20px] border border-border bg-surface px-1.5 py-2 shadow-card">
        {transactions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">Операций пока нет.</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3.5 border-b border-[#f6efe5] px-4 py-3.5 last:border-b-0">
              <div
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold ${
                  tx.isIn ? 'bg-green-soft text-green' : 'bg-peach text-primary-dark'
                }`}
              >
                {tx.isIn ? '+' : '−'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-ink">{tx.label}</div>
                <div className="text-[13px] font-semibold text-faint">{formatDate(tx.createdAt)}</div>
              </div>
              <div className={`whitespace-nowrap font-display text-base font-extrabold ${tx.isIn ? 'text-green' : 'text-primary-dark'}`}>
                {tx.isIn ? '+' : '−'}{tx.amount} 🪙
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
