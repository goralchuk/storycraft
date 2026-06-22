import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import Avatar from '@/components/Avatar';
import {
  generateHeroAction,
  addCompanionAction,
  removeHeroAction,
  topupHeroAction,
} from '@/app/actions/heroes';

type Hero = {
  id: string;
  role: 'MAIN' | 'PET' | 'SIBLING' | 'FRIEND' | 'MAGIC';
  name: string;
  freeAttempts: number;
  status: 'IDLE' | 'GENERATING' | 'DONE';
  imageUrl: string | null;
};

const ROLE_LABELS: Record<Hero['role'], string> = {
  MAIN: 'Главный герой',
  PET: 'Питомец',
  SIBLING: 'Брат / сестра',
  FRIEND: 'Друг',
  MAGIC: 'Волшебный',
};
const STATUS_LABELS: Record<Hero['status'], string> = {
  IDLE: 'ожидает',
  GENERATING: 'генерируется…',
  DONE: 'готов',
};
const COMPANION_ROLES: Hero['role'][] = ['PET', 'SIBLING', 'FRIEND', 'MAGIC'];

const primaryBtn =
  'rounded-pill bg-primary px-5 py-2.5 font-display text-sm font-bold text-white shadow-primary transition hover:-translate-y-0.5';
const ghostBtn =
  'rounded-pill border-2 border-[#efe6da] bg-surface px-5 py-2.5 font-display text-sm font-bold text-ink-soft transition hover:border-[#d8cabb]';

function pluralAttempts(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'генерация';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'генерации';
  return 'генераций';
}

export default async function HeroesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id: childId } = await params;
  const { error } = await searchParams;

  const res = await apiFetch(`/children/${childId}/heroes`, { cache: 'no-store' });
  if (res.status === 404) redirect('/dashboard');
  const heroes = (await res.json()) as Hero[];
  const atLimit = heroes.length >= 5;

  return (
    <main className="mx-auto max-w-[760px] px-6 pt-10 pb-[90px]">
      <div className="mb-[26px]">
        <h1 className="font-display text-[32px] font-extrabold">Герои</h1>
        <p className="mt-[7px] text-[16px] text-muted">
          Создайте героев для книг: один главный и до четырёх компаньонов.
        </p>
      </div>

      {error === 'topup' && (
        <div className="mb-5 rounded-[16px] border border-[#f0d3c4] bg-peach px-[18px] py-3.5 text-sm font-semibold text-primary-dark">
          У этого героя закончились бесплатные генерации — купите ещё 3 ниже.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {heroes.map((h) => (
          <div
            key={h.id}
            className="flex items-center gap-4 rounded-[20px] border border-border bg-surface px-5 py-4 shadow-card"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-field">
              {h.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.imageUrl} alt={h.name} className="h-full w-full object-cover" />
              ) : (
                <Avatar name={h.name} className="h-full w-full rounded-[16px] text-xl" />
              )}
            </div>

            <div className="flex-1">
              <div className="font-display text-[17px] font-bold">{h.name}</div>
              <div className="mt-0.5 text-sm font-semibold text-faint">
                {ROLE_LABELS[h.role]} · {h.freeAttempts}{' '}
                {pluralAttempts(h.freeAttempts)} · {STATUS_LABELS[h.status]}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {h.freeAttempts > 0 ? (
                <form action={generateHeroAction}>
                  <input type="hidden" name="childId" value={childId} />
                  <input type="hidden" name="heroId" value={h.id} />
                  <button type="submit" className={primaryBtn}>
                    Сгенерировать
                  </button>
                </form>
              ) : (
                <form action={topupHeroAction}>
                  <input type="hidden" name="childId" value={childId} />
                  <input type="hidden" name="heroId" value={h.id} />
                  <button type="submit" className={ghostBtn}>
                    Купить 3 (100 🪙)
                  </button>
                </form>
              )}
              {h.role !== 'MAIN' && (
                <form action={removeHeroAction}>
                  <input type="hidden" name="childId" value={childId} />
                  <input type="hidden" name="heroId" value={h.id} />
                  <button
                    type="submit"
                    className="rounded-pill px-3 py-2.5 text-sm font-bold text-[#c0492f] transition hover:bg-[#fbe9e3]"
                  >
                    Удалить
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      {!atLimit && (
        <form
          action={addCompanionAction}
          className="mt-6 flex items-center gap-2.5 rounded-[20px] border border-dashed border-[#e0d4c5] bg-white/40 px-5 py-4"
        >
          <input type="hidden" name="childId" value={childId} />
          <input
            name="name"
            placeholder="Имя компаньона"
            required
            className="flex-1 rounded-[12px] border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
          <select
            name="role"
            className="rounded-[12px] border border-border bg-surface px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
          >
            {COMPANION_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button type="submit" className={primaryBtn}>
            Добавить (100 🪙)
          </button>
        </form>
      )}

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm font-bold text-faint hover:text-primary-dark">
          ← На главную
        </Link>
      </div>
    </main>
  );
}
