'use client';
import { useTransition } from 'react';
import { purchasePackAction } from '@/app/actions/wallet';

export type Pack = { key: string; amount: number };

// Highlights mirror the prototype's popular / best-value badges.
const BADGE: Record<string, { text: string; cls: string }> = {
  PACK_800: { text: 'Популярный', cls: 'bg-primary text-white' },
  PACK_5000: { text: 'Выгодно', cls: 'bg-purple text-white' },
};

export default function PackageGrid({ packages }: { packages: Pack[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {packages.map((p) => {
        const badge = BADGE[p.key];
        return (
          <button
            key={p.key}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => purchasePackAction(p.key))}
            className={`relative rounded-[20px] border-2 bg-surface px-5 py-[22px] text-center shadow-card transition enabled:hover:-translate-y-1 enabled:hover:shadow-pop disabled:cursor-not-allowed disabled:opacity-60 ${
              badge ? 'border-primary' : 'border-border'
            }`}
          >
            {badge && (
              <span className={`absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill px-3 py-1 text-[11px] font-bold ${badge.cls}`}>
                {badge.text}
              </span>
            )}
            <div className="text-[34px]">🪙</div>
            <div className="mt-1.5 font-display text-[26px] font-extrabold">{p.amount}</div>
            <div className="text-[13px] font-semibold text-faint">монет</div>
            <div className="mt-3.5 rounded-xl bg-field py-2.5 font-display text-[15px] font-bold text-primary-dark">
              Купить
            </div>
          </button>
        );
      })}
    </div>
  );
}
