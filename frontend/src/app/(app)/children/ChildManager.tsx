'use client';
import { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import {
  createChildAction,
  updateChildAction,
  deleteChildAction,
  uploadChildPhotoAction,
} from '@/app/actions/children';

export type HeroPreview = { id: string; name: string; imageUrl: string | null };
export type ChildView = {
  id: string;
  name: string;
  birthDate: string | null;
  gender: string | null;
  interests: string[];
  photoUrl: string | null;
  bookCount: number;
  heroes: HeroPreview[];
};

const fieldCls =
  'w-full rounded-[13px] border-2 border-[#efe6da] bg-field px-3.5 py-3 text-[15px] font-semibold text-ink outline-none focus:border-primary';
const labelCls = 'mb-1.5 block text-[13px] font-bold text-ink-soft';
const GENDER_LABEL: Record<string, string> = { male: 'мальчик', female: 'девочка', other: 'другое' };

function age(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (years < 0 || years > 30) return null;
  return `${years} лет`;
}

function subtitle(c: ChildView): string {
  return [age(c.birthDate), c.gender ? GENDER_LABEL[c.gender] ?? c.gender : null]
    .filter(Boolean)
    .join(' · ');
}

const CHIP_COLORS = [
  'bg-purple-soft text-purple',
  'bg-green-soft text-green',
  'bg-peach text-pink',
  'bg-[#eef2ff] text-[#4f46e5]',
  'bg-[#fff9e6] text-[#b8860b]',
];

function ChildFields({ child }: { child?: ChildView }) {
  const birth = child?.birthDate ? child.birthDate.slice(0, 10) : '';
  return (
    <>
      {child && <input type="hidden" name="id" value={child.id} />}
      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3">
        <div>
          <label className={labelCls}>Имя</label>
          <input name="name" required defaultValue={child?.name} placeholder="Имя ребёнка" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Дата рождения</label>
          <input name="birthDate" type="date" defaultValue={birth} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Пол</label>
          <select name="gender" defaultValue={child?.gender ?? ''} className={fieldCls}>
            <option value="">—</option>
            <option value="male">Мальчик</option>
            <option value="female">Девочка</option>
            <option value="other">Другое</option>
          </select>
        </div>
      </div>
      <label className={`${labelCls} mt-4`}>Увлечения</label>
      <input
        name="interests"
        defaultValue={child?.interests.join(', ')}
        placeholder="динозавры, космос, рисование…"
        className={fieldCls}
      />
      <p className="mt-1.5 text-xs text-faint">Перечислите через запятую. По желанию.</p>
    </>
  );
}

export default function ChildManager({
  items,
  hadError,
}: {
  items: ChildView[];
  hadError?: 'hasbooks' | 'upload';
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-[1000px] px-10 pt-10 pb-[90px]">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="font-display text-[34px] font-extrabold">Дети</h1>
          <p className="mt-[7px] text-base text-muted">Профили помогают делать сказки личными.</p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-pill bg-primary px-[22px] py-3 font-display text-[15px] font-bold text-white shadow-primary transition hover:-translate-y-0.5"
        >
          ＋ Добавить ребёнка
        </button>
      </div>

      {hadError === 'hasbooks' && (
        <div className="mb-5 rounded-[16px] border border-[#f3c0b0] bg-[#fff1ec] px-5 py-3.5 text-sm font-semibold text-[#c0392b]">
          Нельзя удалить ребёнка, у которого есть книги.
        </div>
      )}
      {hadError === 'upload' && (
        <div className="mb-5 rounded-[16px] border border-[#f3c0b0] bg-[#fff1ec] px-5 py-3.5 text-sm font-semibold text-[#c0392b]">
          Не удалось загрузить фото. Попробуйте другое изображение.
        </div>
      )}

      {adding && (
        <div className="animate-pop mb-6 rounded-[24px] border border-border bg-surface px-[30px] py-7 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
          <h3 className="mb-[18px] font-display text-[21px] font-bold">Новый профиль ребёнка</h3>
          <form action={createChildAction}>
            <ChildFields />
            <div className="mt-5 flex gap-3">
              <button type="submit" className="rounded-xl bg-primary px-[22px] py-3 font-display text-[15px] font-bold text-white transition hover:-translate-y-px">
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-xl border-2 border-[#efe6da] bg-surface px-[22px] py-3 font-display text-[15px] font-bold text-ink-soft hover:border-[#d8cabb]"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((c) =>
          editing === c.id ? (
            <div key={c.id} className="animate-pop rounded-[24px] border border-border bg-surface p-6 shadow-card md:col-span-2">
              <h3 className="mb-[18px] font-display text-[21px] font-bold">Изменить профиль</h3>
              <form action={updateChildAction}>
                <ChildFields child={c} />
                <div className="mt-5 flex gap-3">
                  <button type="submit" className="rounded-xl bg-primary px-[22px] py-3 font-display text-[15px] font-bold text-white transition hover:-translate-y-px">
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-xl border-2 border-[#efe6da] bg-surface px-[22px] py-3 font-display text-[15px] font-bold text-ink-soft hover:border-[#d8cabb]"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div key={c.id} className="flex gap-[18px] rounded-[24px] border border-border bg-surface p-6 shadow-card">
              {/* avatar + photo upload */}
              <div className="flex flex-col items-center gap-2">
                <Avatar name={c.name} imageUrl={c.photoUrl} className="h-20 w-20 rounded-[22px] text-[34px]" />
                <label className="cursor-pointer text-[11px] font-bold text-faint hover:text-primary-dark">
                  {c.photoUrl ? 'Заменить' : 'Фото'}
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files?.length) return;
                      const fd = new FormData();
                      fd.append('id', c.id);
                      fd.append('file', e.target.files[0]);
                      uploadChildPhotoAction(fd);
                    }}
                  />
                </label>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[21px] font-bold">{c.name}</h3>
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(c.id)} className="text-[13px] font-bold text-faint hover:text-primary-dark">
                      Изменить
                    </button>
                    <form action={deleteChildAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-[13px] font-bold text-faint hover:text-[#c0392b]">
                        Удалить
                      </button>
                    </form>
                  </div>
                </div>
                <p className="mt-0.5 mb-3 text-sm font-semibold text-faint">{subtitle(c) || 'возраст не указан'}</p>

                {c.interests.length > 0 && (
                  <div className="flex flex-wrap gap-[7px]">
                    {c.interests.map((it, i) => (
                      <span key={it} className={`rounded-pill px-[11px] py-[5px] text-xs font-bold ${CHIP_COLORS[i % CHIP_COLORS.length]}`}>
                        {it}
                      </span>
                    ))}
                  </div>
                )}

                {/* saved heroes preview */}
                <div className="mt-3.5 flex items-center gap-2">
                  {c.heroes.length > 0 ? (
                    <div className="flex">
                      {c.heroes.slice(0, 4).map((h, i) => (
                        <div key={h.id} className={i > 0 ? '-ml-2' : ''}>
                          <Avatar name={h.name} imageUrl={h.imageUrl} className="h-7 w-7 rounded-full border-2 border-white text-[11px]" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[13px] font-semibold text-faint">Нет сохранённых героев</span>
                  )}
                  <Link href={`/children/${c.id}/heroes`} className="text-[13px] font-bold text-primary-dark hover:underline">
                    Герои →
                  </Link>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-faint">
                  📚 {c.bookCount} книг
                  {' · '}
                  {c.photoUrl ? <span className="text-[#1f9254]">фото загружено ✓</span> : <span className="text-[#b07d12]">нет фото</span>}
                </div>
              </div>
            </div>
          ),
        )}

        {/* add tile */}
        <button
          onClick={() => setAdding(true)}
          className="flex min-h-[128px] flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-[#e0d4c5] bg-white/40 text-faint transition hover:border-primary hover:bg-surface hover:text-primary-dark"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-peach text-[26px]">＋</div>
          <span className="font-display text-[15px] font-bold">Добавить ребёнка</span>
        </button>
      </div>
    </main>
  );
}
