'use client';
import { useState, useTransition } from 'react';
import { updatePriceAction } from '@/app/actions/pricing';

export type PriceItem = {
  key: string;
  label: string;
  category: string;
  amount: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  BOOK: 'Книги',
  PAGE: 'Страницы (доплата)',
  HERO: 'Герои',
  PACK: 'Пакеты монет',
};

function PriceRow({ item }: { item: PriceItem }) {
  const [amount, setAmount] = useState(item.amount);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = amount !== item.amount;

  const save = () =>
    startTransition(async () => {
      await updatePriceAction(item.key, amount);
      setSaved(true);
    });

  return (
    <div className="flex items-center gap-3 border-b border-[#f6efe5] px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold text-ink">{item.label}</div>
        <div className="font-mono text-xs text-faint">{item.key}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => {
            setAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)));
            setSaved(false);
          }}
          className="w-24 rounded-[11px] border-2 border-[#efe6da] bg-field px-3 py-2 text-right text-[15px] font-bold text-ink outline-none focus:border-primary"
        />
        <span className="text-sm text-faint">🪙</span>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty}
        className="w-[92px] rounded-pill bg-primary px-4 py-2 font-display text-sm font-bold text-white shadow-primary transition enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? '…' : dirty ? 'Сохранить' : saved ? '✓ Готово' : 'Сохранено'}
      </button>
    </div>
  );
}

export default function PriceEditor({ items }: { items: PriceItem[] }) {
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="flex flex-col gap-7">
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="mb-3 font-display text-lg font-bold">{CATEGORY_LABEL[cat] ?? cat}</h2>
          <div className="rounded-[20px] border border-border bg-surface px-1.5 py-2 shadow-card">
            {items
              .filter((i) => i.category === cat)
              .map((i) => (
                <PriceRow key={i.key} item={i} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
