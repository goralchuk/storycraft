'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createDraftAction } from '@/app/actions/books';

export type TemplateOption = {
  id: string;
  title: string;
  icon: string | null;
  coverColor: string | null;
  category: string | null;
  ageRange: string | null;
};

const PERKS: Record<'UNIQUE' | 'TEMPLATE', string[]> = {
  UNIQUE: ['Новый сюжет с нуля', 'Полная настройка темы и стиля', 'Свежие иллюстрации'],
  TEMPLATE: ['Готовый сюжет и стиль', 'Меняете только героя', 'Результат за пару минут'],
};

function TypeCard({
  active,
  onClick,
  glyph,
  glyphBg,
  cost,
  costCls,
  title,
  desc,
  perks,
}: {
  active: boolean;
  onClick: () => void;
  glyph: string;
  glyphBg: string;
  cost: number;
  costCls: string;
  title: string;
  desc: string;
  perks: string[];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-[22px] border-2 bg-surface p-[26px] text-left transition ${
        active ? 'border-primary' : 'border-border hover:border-[#f1c9b3]'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-[27px] ${glyphBg}`}>
          {glyph}
        </div>
        <span className={`inline-flex items-center gap-[5px] rounded-pill px-[13px] py-1.5 font-display text-[15px] font-extrabold ${costCls}`}>
          🪙 {cost}
        </span>
      </div>
      <h3 className="mt-4 mb-1.5 font-display text-[21px] font-extrabold">{title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-muted">{desc}</p>
      <div className="flex flex-col gap-[7px]">
        {perks.map((p) => (
          <div key={p} className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
            <span className="text-green">✓</span> {p}
          </div>
        ))}
      </div>
    </button>
  );
}

export default function WizardStep1({
  templates,
  uniqueCost,
  templateCost,
  balance,
}: {
  templates: TemplateOption[];
  uniqueCost: number;
  templateCost: number;
  balance: number;
}) {
  const [type, setType] = useState<'UNIQUE' | 'TEMPLATE'>('UNIQUE');
  const [templateId, setTemplateId] = useState<string | null>(null);

  const cost = type === 'TEMPLATE' ? templateCost : uniqueCost;
  const cantAfford = balance < cost;
  const needsTemplate = type === 'TEMPLATE' && !templateId;
  const disabled = cantAfford || needsTemplate;

  return (
    <div className="animate-pop">
      <h2 className="mb-1 font-display text-[30px] font-extrabold">Какую книгу создаём?</h2>
      <p className="mb-[22px] text-base text-muted">
        Монеты спишутся сразу. Оплаченная книга сохранится — вы сможете продолжить настройку позже.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TypeCard
          active={type === 'UNIQUE'}
          onClick={() => setType('UNIQUE')}
          glyph="✨"
          glyphBg="bg-peach"
          cost={uniqueCost}
          costCls="bg-peach text-primary-dark"
          title="Уникальная книга"
          desc="ИИ напишет совершенно новый сюжет под вашего героя, тему и пожелание."
          perks={PERKS.UNIQUE}
        />
        <TypeCard
          active={type === 'TEMPLATE'}
          onClick={() => setType('TEMPLATE')}
          glyph="📗"
          glyphBg="bg-green-soft"
          cost={templateCost}
          costCls="bg-green-soft text-green"
          title="Книга по шаблону"
          desc="Готовый проверенный сюжет — вы меняете только героя. Быстрее и дешевле."
          perks={PERKS.TEMPLATE}
        />
      </div>

      {type === 'TEMPLATE' && (
        <div className="mt-[26px]">
          <h3 className="mb-3 font-display text-lg font-bold">Выберите шаблон</h3>
          {templates.length === 0 ? (
            <p className="text-sm text-muted">Шаблоны пока недоступны.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
              {templates.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={`relative overflow-hidden rounded-[18px] border-2 bg-surface text-left transition ${
                    templateId === t.id ? 'border-primary' : 'border-border hover:border-[#f1c9b3]'
                  }`}
                >
                  <div
                    className="flex h-20 items-center justify-center text-4xl"
                    style={{ background: t.coverColor ?? '#ede0ff' }}
                  >
                    {t.icon ?? '📖'}
                  </div>
                  <div className="px-3.5 py-[11px]">
                    <h3 className="font-display text-[15px] font-bold">{t.title}</h3>
                    <p className="mt-[3px] text-xs text-faint">
                      {[t.category, t.ageRange].filter(Boolean).join(' · ') || 'Сказка'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form action={createDraftAction} className="mt-[34px] flex items-center gap-3.5">
        <input type="hidden" name="bookType" value={type} />
        {type === 'TEMPLATE' && templateId && (
          <input type="hidden" name="templateId" value={templateId} />
        )}
        <Link
          href="/dashboard"
          className="rounded-pill border-2 border-[#efe6da] bg-surface px-6 py-3.5 font-display text-base font-bold text-ink-soft transition hover:border-[#d8cabb]"
        >
          ← Назад
        </Link>
        <div className="flex-1" />
        {cantAfford && (
          <span className="text-sm font-bold text-primary-dark">
            Не хватает монет ·{' '}
            <Link href="/wallet" className="underline">
              пополнить
            </Link>
          </span>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="rounded-pill bg-primary px-[30px] py-3.5 font-display text-base font-bold text-white shadow-primary transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Оплатить и настроить · {cost} 🪙
        </button>
      </form>
    </div>
  );
}
