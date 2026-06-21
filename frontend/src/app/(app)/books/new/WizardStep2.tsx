'use client';
import { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { saveChildAction, saveDraftAction } from '@/app/actions/books';
import {
  generateHeroAction,
  topupHeroAction,
  addCompanionAction,
  removeHeroAction,
} from '@/app/actions/heroes';

export type Child = { id: string; name: string; birthDate: string | null; photoUrl: string | null };
export type Hero = {
  id: string;
  role: 'MAIN' | 'PET' | 'SIBLING' | 'FRIEND' | 'MAGIC';
  name: string;
  description: string | null;
  freeAttempts: number;
  status: 'IDLE' | 'GENERATING' | 'DONE';
  imageUrl: string | null;
};
export type Topic = { id: string; icon: string; label: string };

type Draft = {
  id: string;
  bookType: 'UNIQUE' | 'TEMPLATE';
  childId: string | null;
  pageCount: number | null;
  topicId: string | null;
  writingStyle: string | null;
  promptText: string | null;
  template: { title: string } | null;
};

const STYLES = [
  { key: 'WATERCOLOR', glyph: '🎨', label: 'Акварель', hint: 'мягкий, нежный' },
  { key: 'ADVENTURE', glyph: '🗺️', label: 'Приключение', hint: 'яркий, смелый' },
  { key: 'FUNNY', glyph: '😄', label: 'Весёлый', hint: 'забавный' },
  { key: 'GENTLE', glyph: '🌸', label: 'Нежный', hint: 'тёплый' },
];
const PAGE_TIERS = [12, 16, 20, 24] as const;
const ROLE_LABEL: Record<Hero['role'], string> = {
  MAIN: 'Главный герой',
  PET: 'Питомец',
  SIBLING: 'Брат / сестра',
  FRIEND: 'Друг',
  MAGIC: 'Волшебный спутник',
};
const COMPANION_ROLES = [
  { role: 'PET', glyph: '🐾', label: 'Питомец' },
  { role: 'SIBLING', glyph: '👧', label: 'Брат / сестра' },
  { role: 'FRIEND', glyph: '🧒', label: 'Друг' },
  { role: 'MAGIC', glyph: '🧚', label: 'Волшебный' },
] as const;
const MAX_HEROES = 5;
const FREE_MAX = 3;

const cardSel = (on: boolean) =>
  `relative rounded-2xl border-2 bg-surface transition ${on ? 'border-primary' : 'border-border hover:border-[#f1c9b3]'}`;

function age(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const y = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return y >= 0 && y <= 30 ? `${y} лет` : null;
}

function HeroCard({
  hero,
  childId,
  topupCost,
  styleLabel,
}: {
  hero: Hero;
  childId: string;
  topupCost: number;
  styleLabel: string;
}) {
  const done = hero.status === 'DONE' && !!hero.imageUrl;
  const generating = hero.status === 'GENERATING';
  const canGen = hero.freeAttempts > 0;

  return (
    <div className="relative overflow-hidden rounded-[20px] border-2 border-border bg-surface shadow-[0_6px_18px_rgba(120,90,60,0.05)]">
      {hero.role !== 'MAIN' && (
        <form action={removeHeroAction}>
          <input type="hidden" name="childId" value={childId} />
          <input type="hidden" name="heroId" value={hero.id} />
          <button
            type="submit"
            title="Убрать героя"
            className="absolute right-2.5 top-2.5 z-[3] flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border bg-white/90 text-sm text-faint transition hover:border-[#f1c9b3] hover:text-primary-dark"
          >
            ✕
          </button>
        </form>
      )}

      <div className="relative flex h-[150px] items-center justify-center bg-field">
        {done ? (
          <>
            <Avatar name={hero.name} imageUrl={hero.imageUrl} className="h-full w-full rounded-none text-5xl" />
            <span className="absolute left-2.5 top-2.5 rounded-pill bg-white/85 px-[9px] py-[3px] text-[11px] font-bold text-[#7a6f67]">
              {styleLabel}
            </span>
            <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-[#dcffe9] px-[11px] py-1 text-[11px] font-bold text-green">
              🔒 Образ зафиксирован
            </span>
          </>
        ) : generating ? (
          <div className="flex flex-col items-center gap-[11px]">
            <div className="h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
            <span className="text-[13px] font-bold text-[#7a6f67]">Генерируем образ…</span>
          </div>
        ) : (
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-2 border-dashed border-[#78593a4d] text-[26px] opacity-55">
            {hero.role === 'MAIN' ? '🧒' : '🎭'}
          </div>
        )}
      </div>

      <div className="px-4 pb-[15px] pt-3">
        <h4 className="truncate font-display text-base font-bold">{hero.name}</h4>
        <p className="mt-0.5 text-xs font-semibold text-faint">{ROLE_LABEL[hero.role]}</p>

        <div className="mt-2.5">
          {canGen ? (
            <span className="inline-flex items-center gap-[5px] rounded-pill bg-purple-soft px-2.5 py-1 text-[11px] font-bold text-purple">
              ✨ Генераций: {hero.freeAttempts}/{FREE_MAX}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[5px] rounded-pill bg-peach px-2.5 py-1 text-[11px] font-bold text-primary-dark">
              ⏳ Исчерпано · 🪙 {topupCost} за +3
            </span>
          )}
        </div>

        {hero.role === 'MAIN' && (
          <div className="mt-2.5 inline-flex items-center gap-[5px] rounded-pill border border-border bg-field px-2.5 py-1 text-[11px] font-bold text-muted">
            🧒 Основа — профиль ребёнка
          </div>
        )}

        {canGen ? (
          <form action={generateHeroAction} className="mt-2.5">
            <input type="hidden" name="childId" value={childId} />
            <input type="hidden" name="heroId" value={hero.id} />
            <textarea
              name="description"
              defaultValue={hero.description ?? ''}
              placeholder="Опишите внешность — необязательно"
              className="min-h-[58px] w-full resize-y rounded-[11px] border-2 border-[#efe6da] bg-field px-[11px] py-[9px] text-[13px] font-semibold leading-snug text-ink outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-primary px-4 py-2 font-display text-[13px] font-bold text-white shadow-primary transition hover:-translate-y-px"
            >
              {done ? '↻ Заново' : '✨ Сгенерировать'}
            </button>
          </form>
        ) : (
          <form action={topupHeroAction} className="mt-2.5">
            <input type="hidden" name="childId" value={childId} />
            <input type="hidden" name="heroId" value={hero.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-pill border-2 border-[#f1c9b3] bg-surface px-4 py-2 font-display text-xs font-bold text-primary-dark transition hover:bg-peach"
            >
              🪙 {topupCost} · +3 попытки
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function WizardStep2({
  draft,
  kids,
  heroes,
  topics,
  balance,
  companionCost,
  topupCost,
  pageSurcharge,
}: {
  draft: Draft;
  kids: Child[];
  heroes: Hero[];
  topics: Topic[];
  balance: number;
  companionCost: number;
  topupCost: number;
  pageSurcharge: Record<number, number>;
}) {
  const isTemplate = draft.bookType === 'TEMPLATE';
  const [style, setStyle] = useState(draft.writingStyle ?? 'WATERCOLOR');
  const [topicId, setTopicId] = useState(draft.topicId ?? '');
  const [pages, setPages] = useState(draft.pageCount ?? 12);
  const [wish, setWish] = useState(draft.promptText ?? '');
  const [addingHero, setAddingHero] = useState(false);

  const styleLabel = STYLES.find((s) => s.key === style)?.label ?? '';
  const surcharge = pageSurcharge[pages] ?? 0;
  const childSelected = !!draft.childId;
  const atLimit = heroes.length >= MAX_HEROES;
  const cantAffordHero = balance < companionCost;

  return (
    <div className="animate-pop">
      <h2 className="mb-1 font-display text-[30px] font-extrabold">Настройка книги</h2>
      <p className="mb-5 max-w-[640px] text-base text-muted">
        Соберите героев — их образ зафиксируется и будет одинаковым на всех страницах.
      </p>

      {isTemplate && (
        <div className="mb-[18px] flex items-start gap-[11px] rounded-2xl border border-[#c9ecd8] bg-green-soft px-[18px] py-3.5">
          <span className="text-lg">🔒</span>
          <p className="text-sm font-semibold leading-relaxed text-[#3f8a64]">
            Книга по шаблону{draft.template ? ` «${draft.template.title}»` : ''}: сюжет, стиль и объём уже заданы.
            Здесь можно изменить только героев — остальные настройки заблокированы.
          </p>
        </div>
      )}

      {/* main child */}
      <h3 className="mb-3 font-display text-lg font-bold">Главный герой</h3>
      <div className="mb-2 flex flex-wrap gap-3">
        {kids.map((c) => {
          const on = draft.childId === c.id;
          return (
            <form action={saveChildAction} key={c.id}>
              <input type="hidden" name="draftId" value={draft.id} />
              <input type="hidden" name="childId" value={c.id} />
              <button
                type="submit"
                className={`flex items-center gap-[11px] rounded-2xl border-2 bg-surface py-[11px] pl-3 pr-[18px] transition ${
                  on ? 'border-primary' : 'border-border hover:border-[#f1c9b3]'
                }`}
              >
                <Avatar name={c.name} imageUrl={c.photoUrl} className="h-[42px] w-[42px] rounded-full text-[19px]" />
                <span className="text-left">
                  <span className="block font-display text-[15px] font-bold">{c.name}</span>
                  <span className="block text-xs font-semibold text-faint">{age(c.birthDate) ?? 'возраст не указан'}</span>
                </span>
              </button>
            </form>
          );
        })}
        <Link
          href="/children"
          className="flex w-[52px] items-center justify-center rounded-2xl border-2 border-dashed border-[#e0d4c5] text-2xl text-[#b09a89] transition hover:border-primary hover:text-primary-dark"
        >
          ＋
        </Link>
      </div>

      <div className="my-[22px] flex items-start gap-[11px] rounded-2xl border border-[#e3d6fb] bg-[#f3edff] px-[18px] py-3.5">
        <span className="text-lg">🔗</span>
        <p className="text-sm font-semibold leading-relaxed text-[#6b5d8a]">
          Образ героя <b>фиксируется</b> и передаётся в каждую следующую иллюстрацию как референс — поэтому
          внешность персонажей не «плывёт» от страницы к странице.
        </p>
      </div>

      {/* heroes */}
      {!childSelected ? (
        <div className="rounded-[20px] border-2 border-dashed border-[#e0d4c5] bg-white/40 px-6 py-10 text-center text-muted">
          Выберите главного героя выше, чтобы собрать персонажей книги.
        </div>
      ) : (
        <>
          <div className="mt-6 mb-3.5 flex flex-wrap items-end justify-between gap-3.5">
            <h3 className="font-display text-lg font-bold">Герои книги</h3>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-sm font-bold text-faint">
                Героев: {heroes.length} из {MAX_HEROES}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-peach px-[13px] py-1.5 font-display text-[13px] font-bold text-primary-dark">
                🪙 {companionCost} за доп. героя
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {heroes.map((h) => (
              <HeroCard key={h.id} hero={h} childId={draft.childId!} topupCost={topupCost} styleLabel={styleLabel} />
            ))}

            {!atLimit && (
              <button
                type="button"
                onClick={() => setAddingHero((v) => !v)}
                className="flex min-h-[217px] flex-col items-center justify-center gap-2.5 rounded-[20px] border-2 border-dashed border-[#e0d4c5] bg-white/40 text-[#b09a89] transition hover:border-primary hover:bg-surface hover:text-primary-dark"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-peach text-[25px]">＋</div>
                <span className="font-display text-sm font-bold">Добавить героя</span>
                <span className="inline-flex items-center gap-[5px] rounded-pill bg-peach px-[11px] py-[3px] font-display text-xs font-extrabold text-primary-dark">
                  🪙 {companionCost}
                </span>
              </button>
            )}
          </div>

          {addingHero && !atLimit && (
            <div className="animate-pop mt-4 rounded-[18px] border border-border bg-surface px-5 py-[18px] shadow-[0_8px_22px_rgba(120,90,60,0.07)]">
              <div className="mb-3 flex items-center justify-between gap-2.5">
                <span className="font-display text-[15px] font-bold">Кого добавить в историю?</span>
                <span className="inline-flex items-center gap-[5px] rounded-pill bg-peach px-3 py-[5px] font-display text-[13px] font-extrabold text-primary-dark">
                  🪙 {companionCost} за героя
                </span>
              </div>
              {cantAffordHero && (
                <div className="mb-3 rounded-xl border border-[#f4e1b0] bg-[#fff5e0] px-3.5 py-2.5 text-[13px] font-semibold text-[#9a7b25]">
                  Не хватает монет — добавление откроет кошелёк для пополнения.
                </div>
              )}
              <form action={addCompanionAction} className="flex flex-wrap items-center gap-2.5">
                <input type="hidden" name="childId" value={draft.childId!} />
                <input
                  name="name"
                  required
                  placeholder="Имя — например, Бакс"
                  className="min-w-[160px] flex-1 rounded-[13px] border-2 border-[#efe6da] bg-field px-3.5 py-2.5 text-[14px] font-semibold text-ink outline-none focus:border-primary"
                />
                <select
                  name="role"
                  defaultValue="PET"
                  className="rounded-[13px] border-2 border-[#efe6da] bg-field px-3.5 py-2.5 text-[14px] font-semibold text-ink outline-none focus:border-primary"
                >
                  {COMPANION_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.glyph} {r.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-pill bg-primary px-5 py-2.5 font-display text-[14px] font-bold text-white shadow-primary transition hover:-translate-y-px"
                >
                  Добавить
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* story settings (frozen for templates) */}
      {!isTemplate && (
        <div className="mt-8">
          <h3 className="mb-3 font-display text-lg font-bold">Стиль рисовки</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STYLES.map((s) => (
              <button
                type="button"
                key={s.key}
                onClick={() => setStyle(s.key)}
                className={`${cardSel(style === s.key)} p-4 text-center`}
              >
                <div className="text-[26px]">{s.glyph}</div>
                <div className="mt-[5px] text-sm font-bold">{s.label}</div>
                <div className="text-xs text-faint">{s.hint}</div>
              </button>
            ))}
          </div>

          {topics.length > 0 && (
            <>
              <h3 className="mb-3 mt-7 font-display text-lg font-bold">Тема истории</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {topics.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTopicId((cur) => (cur === t.id ? '' : t.id))}
                    className={`${cardSel(topicId === t.id)} px-3 py-4 text-center`}
                  >
                    <div className="text-[30px]">{t.icon}</div>
                    <div className="mt-1.5 text-[13px] font-bold">{t.label}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          <h3 className="mb-3 mt-7 font-display text-lg font-bold">
            Объём книги{' '}
            <span className="text-sm font-semibold text-faint">— 12 страниц включено, далее доплата</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {PAGE_TIERS.map((p) => {
              const extra = pageSurcharge[p] ?? 0;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPages(p)}
                  className={`${cardSel(pages === p)} flex-1 px-3 py-4 text-center`}
                >
                  <div className="font-display text-2xl font-extrabold">{p}</div>
                  <div className="text-[13px] font-semibold text-faint">страниц</div>
                  <div className="mt-2">
                    {extra > 0 ? (
                      <span className="inline-flex rounded-pill bg-peach px-2.5 py-[3px] text-[11px] font-bold text-primary-dark">
                        +{extra} 🪙
                      </span>
                    ) : (
                      <span className="inline-flex rounded-pill bg-[#dcffe9] px-2.5 py-[3px] text-[11px] font-bold text-green">
                        Включено
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {surcharge > 0 ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-[#f4dcc9] bg-peach px-4 py-[11px]">
              <span>🪙</span>
              <p className="text-[13px] font-semibold leading-snug text-[#a85a32]">
                Доплата за объём: <b>+{surcharge} монет</b> — спишется при запуске генерации.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-muted">12 страниц включено в стоимость книги — доплата не нужна.</p>
          )}

          <h3 className="mb-3 mt-7 font-display text-lg font-bold">
            Особое пожелание <span className="text-sm font-semibold text-faint">— необязательно</span>
          </h3>
          <textarea
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            placeholder="Например: Эмма недавно завела щенка по имени Бакс — было бы здорово, если бы он стал её спутником в приключении."
            className="min-h-[90px] w-full resize-y rounded-2xl border-2 border-[#efe6da] bg-field p-[15px] text-[15px] font-semibold leading-relaxed text-ink outline-none focus:border-primary"
          />
        </div>
      )}

      {/* footer */}
      <form action={saveDraftAction} className="mt-[34px] flex items-center gap-3.5">
        <input type="hidden" name="draftId" value={draft.id} />
        <input type="hidden" name="childId" value={draft.childId ?? ''} />
        {!isTemplate && (
          <>
            <input type="hidden" name="writingStyle" value={style} />
            <input type="hidden" name="topicId" value={topicId} />
            <input type="hidden" name="pageCount" value={pages} />
            <input type="hidden" name="promptText" value={wish} />
          </>
        )}
        <Link
          href="/dashboard"
          className="rounded-pill border-2 border-[#efe6da] bg-surface px-6 py-3.5 font-display text-base font-bold text-ink-soft transition hover:border-[#d8cabb]"
        >
          ← Сохранить и выйти
        </Link>
        <div className="flex-1" />
        {!childSelected && (
          <span className="text-sm font-bold text-primary-dark">Выберите главного героя</span>
        )}
        <button
          type="submit"
          disabled={!childSelected}
          className="rounded-pill bg-primary px-[30px] py-3.5 font-display text-base font-bold text-white shadow-primary transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          К генерации →
        </button>
      </form>
    </div>
  );
}
