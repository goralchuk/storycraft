import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import Avatar from '@/components/Avatar';
import StatusBadge from '@/components/StatusBadge';

type Book = {
  id: string;
  status: string;
  pageCount: number;
  title: string | null;
  createdAt: string;
  template: { title: string; icon: string | null; coverColor: string | null } | null;
  topic: { icon: string; label: string } | null;
  child: { name: string } | null;
};

const createBtn =
  'inline-flex items-center gap-2 rounded-pill bg-primary px-6 py-3.5 font-display text-base font-bold text-white shadow-primary transition hover:-translate-y-0.5';

function bookTitle(b: Book) {
  if (b.title) return b.title;
  const subject = b.template?.title ?? b.topic?.label ?? 'Сказка';
  return b.child ? `${b.child.name} · ${subject}` : subject;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userRes = await apiFetch('/users/me');
  if (!userRes.ok) redirect('/login');
  const user = (await userRes.json()) as { name: string | null };
  if (!user.name) redirect('/onboarding');

  const [booksRes, draftRes, childrenRes] = await Promise.all([
    apiFetch('/books', { cache: 'no-store' }),
    apiFetch('/books/draft', { cache: 'no-store' }),
    apiFetch('/children', { cache: 'no-store' }),
  ]);
  const books = (await booksRes.json()) as Book[];
  const draft = (draftRes.ok ? await draftRes.json() : null) as { id: string } | null;
  const children = (childrenRes.ok ? await childrenRes.json() : []) as { id: string }[];

  return (
    <main className="mx-auto max-w-[1180px] px-10 pt-10 pb-[90px]">
      {/* header */}
      <div className="mb-[30px] flex items-end justify-between">
        <div>
          <h1 className="font-display text-[36px] font-extrabold">Привет, {user.name}! 👋</h1>
          <p className="mt-[7px] text-[17px] text-muted">Создавайте волшебные истории для своих детей.</p>
        </div>
        <Link href="/books/new" className={createBtn}>✨ Создать книгу</Link>
      </div>

      {/* draft banner */}
      {draft && (
        <div className="mb-[26px] flex items-center gap-[15px] rounded-[20px] border border-[#c9ecd8] bg-green-soft px-[22px] py-[18px]">
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-surface text-[23px]">📗</div>
          <div className="flex-1">
            <div className="font-display text-[17px] font-bold">У вас есть оплаченная книга</div>
            <div className="text-sm font-semibold text-[#5e8a72]">
              Вы оплатили генерацию, но не завершили настройку. Продолжите с того же места.
            </div>
          </div>
          <Link
            href="/books/new"
            className="shrink-0 rounded-pill bg-green px-[22px] py-3 font-display text-[15px] font-bold text-white transition hover:-translate-y-0.5"
          >
            Продолжить →
          </Link>
        </div>
      )}

      {books.length === 0 ? (
        /* empty state */
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-surface px-10 py-[60px] text-center shadow-[0_8px_28px_rgba(120,90,60,0.06)]">
          <div className="absolute top-6 left-[50px] text-xl text-[#e8a36a]">✦</div>
          <div className="absolute bottom-10 right-[70px] text-base text-[#b89adf]">✦</div>
          <div className="mx-auto flex h-[120px] w-[120px] -rotate-6 items-center justify-center rounded-[32px] bg-peach text-[60px] shadow-[0_10px_26px_rgba(120,90,60,0.1)]">
            📖
          </div>
          <h2 className="mt-[26px] mb-2 font-display text-[30px] font-extrabold">Создайте первую книгу</h2>
          <p className="mx-auto mb-[26px] max-w-[420px] text-[17px] leading-[1.5] text-muted">
            У вас пока нет сказок. Выберите шаблон и за пару минут получите личную книгу для вашего ребёнка.
          </p>
          <Link href="/books/new" className={createBtn}>✨ Создать книгу</Link>
        </div>
      ) : (
        <>
          {/* stats */}
          <div className="mb-[34px] grid grid-cols-1 gap-[18px] sm:grid-cols-3">
            <StatCard icon="📚" bg="bg-peach" value={books.length} label="книг создано" />
            <StatCard icon="🧒" bg="bg-purple-soft" value={children.length} label="профиля детей" />
            <StatCard icon="⭐" bg="bg-green-soft" value="Free" label="тариф" />
          </div>

          <h2 className="mb-[18px] font-display text-[23px] font-extrabold">Мои книги</h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {/* new book tile */}
            <Link
              href="/books/new"
              className="flex min-h-[250px] flex-col items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed border-[#e0d4c5] bg-white/40 text-faint transition hover:border-primary hover:bg-surface hover:text-primary-dark"
            >
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-peach text-[28px]">＋</div>
              <span className="font-display text-[15px] font-bold">Новая книга</span>
            </Link>

            {books.map((b) => {
              const cover = b.template?.coverColor ?? undefined;
              const emoji = b.template?.icon ?? b.topic?.icon ?? '📖';
              return (
                <Link
                  key={b.id}
                  href={`/books/${b.id}`}
                  className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-card transition hover:-translate-y-1.5 hover:shadow-pop"
                >
                  <div
                    className="relative flex h-[150px] items-center justify-center bg-purple-soft text-[50px]"
                    style={cover ? { background: cover } : undefined}
                  >
                    <span className={b.status === 'PROCESSING' || b.status === 'PENDING' ? 'opacity-45' : ''}>
                      {emoji}
                    </span>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                  <div className="px-[18px] pt-4 pb-[18px]">
                    <h3 className="font-display text-[17px] font-bold leading-tight">{bookTitle(b)}</h3>
                    <div className="mt-2 flex items-center gap-[7px] text-[13px] font-semibold text-faint">
                      {b.child && <Avatar name={b.child.name} className="h-[22px] w-[22px] rounded-full text-[11px]" />}
                      {b.child ? `${b.child.name} · ` : ''}{b.pageCount} стр.
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({ icon, bg, value, label }: { icon: string; bg: string; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[20px] border border-border bg-surface px-[22px] py-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl ${bg}`}>{icon}</div>
      <div>
        <div className="font-display text-[26px] font-extrabold leading-none">{value}</div>
        <div className="text-sm font-semibold text-muted">{label}</div>
      </div>
    </div>
  );
}
