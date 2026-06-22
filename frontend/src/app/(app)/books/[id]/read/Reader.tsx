'use client';
import { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

type PageLayout = 'IMAGE_ONLY' | 'IMAGE_TEXT' | 'TEXT_ONLY';
type Spread = { text: string; imageUrl: string | null; layout: PageLayout };

export default function Reader({
  title,
  cover,
  childName,
  spreads,
  pdfUrl,
}: {
  title: string;
  cover: { color: string | null; emoji: string };
  childName: string | null;
  spreads: Spread[];
  pdfUrl: string | null;
}) {
  // Index 0 is the cover; 1..N are page spreads.
  const total = spreads.length + 1;
  const [index, setIndex] = useState(0);
  const onCover = index === 0;
  const spread = onCover ? null : spreads[index - 1];

  return (
    <main className="mx-auto max-w-[820px] px-6 pt-8 pb-[120px]">
      {/* top bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="text-sm font-bold text-faint hover:text-primary-dark">
          ← На главную
        </Link>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-pill border-2 border-[#efe6da] bg-surface px-5 py-2.5 font-display text-sm font-bold text-ink-soft transition hover:border-[#d8cabb]"
          >
            ⬇ Скачать PDF
          </a>
        )}
      </div>

      {/* book surface */}
      <div className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-card">
        {onCover ? (
          <div
            className="flex min-h-[460px] flex-col items-center justify-center px-8 py-16 text-center"
            style={{ background: cover.color ?? 'var(--color-peach)' }}
          >
            <div className="flex h-28 w-28 -rotate-6 items-center justify-center rounded-[32px] bg-white/70 text-[64px] shadow-[0_10px_26px_rgba(120,90,60,0.12)]">
              {cover.emoji}
            </div>
            <h1 className="mt-7 font-display text-[34px] font-extrabold leading-tight text-ink">{title}</h1>
            {childName && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-pill bg-white/70 px-[15px] py-[7px] text-sm font-bold text-ink-soft">
                <Avatar name={childName} className="h-6 w-6 rounded-full text-[11px]" />
                для {childName}
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[460px] flex-col">
            {spread?.layout !== 'TEXT_ONLY' && spread?.imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={spread.imageUrl}
                alt=""
                className={`w-full object-cover ${spread.layout === 'IMAGE_ONLY' ? 'min-h-[460px] flex-1' : 'max-h-[440px]'}`}
              />
            )}
            {spread?.layout !== 'IMAGE_ONLY' && (
              <p
                className={`px-8 py-7 text-[18px] leading-[1.75] text-ink ${spread?.layout === 'TEXT_ONLY' ? 'flex flex-1 items-center justify-center text-center text-[20px]' : 'flex-1'}`}
              >
                {spread?.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* controls */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-pill border-2 border-[#efe6da] bg-surface px-6 py-3 font-display text-base font-bold text-ink-soft transition enabled:hover:border-[#d8cabb] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Назад
        </button>
        <span className="font-display text-sm font-bold text-faint">
          {onCover ? 'Обложка' : `стр ${index} из ${spreads.length}`}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index === total - 1}
          className="rounded-pill bg-primary px-6 py-3 font-display text-base font-bold text-white shadow-primary transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Дальше →
        </button>
      </div>
    </main>
  );
}
