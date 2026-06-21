import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { generateBookAction } from '@/app/actions/books';
import WizardStepper from '@/components/WizardStepper';
import Avatar from '@/components/Avatar';
import StatusPoller from './StatusPoller';

type Illustration = { id: string; imageUrl: string | null; featuresChild: boolean };
type Page = { id: string; pageNum: number; text: string | null; illustrations: Illustration[] };
type BookStage = 'HEROES' | 'STORY' | 'ILLUSTRATIONS' | 'ASSEMBLE' | null;
type Book = {
  id: string;
  title: string | null;
  status: 'DRAFT' | 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  stage: BookStage;
  progress: number;
  pageCount: number;
  slots: Record<string, string> | null;
  pages: Page[];
  template: { title: string; icon: string | null; coverColor: string | null } | null;
  topic: { icon: string; label: string } | null;
  child: { name: string } | null;
};

const STAGES: { key: NonNullable<BookStage>; label: string; note: string }[] = [
  { key: 'HEROES', label: 'Создаём героев', note: 'Фиксируем образы персонажей' },
  { key: 'STORY', label: 'Пишем историю', note: 'Сочиняем сюжет под вашего героя' },
  { key: 'ILLUSTRATIONS', label: 'Рисуем иллюстрации', note: 'Генерируем страницы по образам' },
  { key: 'ASSEMBLE', label: 'Собираем книгу', note: 'Финальная вёрстка и сборка' },
];

const wrap = 'mx-auto max-w-[980px] px-10 pt-9 pb-[120px]';
const coverTile =
  'mx-auto flex h-24 w-24 -rotate-6 items-center justify-center rounded-[28px] text-5xl shadow-[0_10px_26px_rgba(120,90,60,0.1)]';

// Page text is stored slot-tokenized ({{child}}); resolve for display.
function resolveSlots(text: string | null, slots: Record<string, string> | null): string {
  if (!text) return '';
  if (!slots) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => slots[key] ?? `{{${key}}}`);
}

function bookTitle(b: Book): string {
  const resolved = resolveSlots(b.title, b.slots);
  if (resolved) return resolved;
  const subject = b.template?.title ?? b.topic?.label ?? 'Сказка';
  return b.child ? `${b.child.name} · ${subject}` : subject;
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  const res = await apiFetch(`/books/${id}`);
  if (res.status === 404) redirect('/dashboard');
  const book = (await res.json()) as Book;

  const cover = book.template?.coverColor ?? undefined;
  const emoji = book.template?.icon ?? book.topic?.icon ?? '📖';
  const inProgress = book.status === 'PENDING' || book.status === 'PROCESSING';
  const currentIndex = book.stage ? STAGES.findIndex((s) => s.key === book.stage) : 0;

  return (
    <main className={wrap}>
      <WizardStepper active={3} />

      {/* READY (draft) — generation hasn't started yet */}
      {book.status === 'DRAFT' && (
        <div className="animate-pop mx-auto mt-2.5 max-w-[560px] text-center">
          <div className={coverTile} style={{ background: cover ?? 'var(--color-peach)' }}>
            {emoji}
          </div>
          <h2 className="mt-6 mb-1.5 font-display text-[30px] font-extrabold">Всё готово к генерации</h2>
          <p className="mb-2 text-base leading-relaxed text-muted">
            Книга уже оплачена на шаге выбора типа. Запустите генерацию — ИИ напишет историю и нарисует
            страницы по зафиксированным образам героев.
          </p>
          {book.pageCount > 12 && (
            <p className="mb-2 text-sm font-semibold text-primary-dark">
              При запуске спишется доплата за объём ({book.pageCount} стр.).
            </p>
          )}
          <div className="mb-6 inline-flex items-center gap-2 rounded-pill bg-green-soft px-[15px] py-[7px] text-[13px] font-bold text-green">
            ✓ Оплачено · генерация включена
          </div>
          <form action={generateBookAction}>
            <input type="hidden" name="bookId" value={book.id} />
            <button
              type="submit"
              className="rounded-pill bg-primary px-[34px] py-4 font-display text-lg font-bold text-white shadow-primary transition hover:-translate-y-0.5"
            >
              ✨ Сгенерировать книгу
            </button>
          </form>
          <div className="mt-5">
            <Link href="/books/new" className="text-sm font-bold text-faint hover:text-primary-dark">
              ← Вернуться к настройке
            </Link>
          </div>
        </div>
      )}

      {/* IN PROGRESS */}
      {inProgress && (
        <div className="mx-auto max-w-[620px]">
          <h2 className="mb-1 text-center font-display text-[28px] font-extrabold">Создаём вашу книгу…</h2>
          <p className="mb-6 text-center text-[15px] text-muted">
            Не закрывайте страницу — это займёт около минуты.
          </p>
          <div className="mb-2 h-2.5 overflow-hidden rounded-pill bg-border">
            <div
              className="h-full rounded-pill bg-primary transition-[width] duration-500"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <div className="mb-6 text-right font-display text-[13px] font-bold text-faint">{book.progress}%</div>

          <div className="flex flex-col gap-3">
            {STAGES.map((s, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              return (
                <div
                  key={s.key}
                  className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-[18px] py-[15px]"
                >
                  <div
                    className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-base ${
                      done
                        ? 'bg-green-soft text-green'
                        : current
                          ? 'bg-peach'
                          : 'bg-field text-faint'
                    }`}
                  >
                    {done ? (
                      '✓'
                    ) : current ? (
                      <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-display text-base font-bold ${current || done ? 'text-ink' : 'text-faint'}`}>
                      {s.label}
                    </div>
                    <div className="text-[13px] font-semibold text-faint">{s.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <StatusPoller />
        </div>
      )}

      {/* FAILED */}
      {book.status === 'FAILED' && (
        <div className="animate-pop mx-auto mt-2.5 max-w-[520px] text-center">
          <div className={coverTile} style={{ background: 'var(--color-peach)' }}>⚠️</div>
          <h2 className="mt-6 mb-1.5 font-display text-[28px] font-extrabold">Не удалось создать книгу</h2>
          <p className="mb-6 text-base leading-relaxed text-muted">
            Что-то пошло не так во время генерации. Попробуйте создать книгу заново.
          </p>
          <Link
            href="/books/new"
            className="rounded-pill bg-primary px-[30px] py-3.5 font-display text-base font-bold text-white shadow-primary transition hover:-translate-y-0.5"
          >
            Создать заново
          </Link>
        </div>
      )}

      {/* DONE */}
      {book.status === 'DONE' && (
        <>
          <div className="animate-pop mx-auto max-w-[560px] text-center">
            <div className={coverTile} style={{ background: cover ?? 'var(--color-peach)' }}>
              {emoji}
            </div>
            <h2 className="mt-6 mb-1.5 font-display text-[30px] font-extrabold">Книга готова! 🎉</h2>
            <h3 className="mb-2 font-display text-lg font-bold text-ink-soft">{bookTitle(book)}</h3>
            {book.child && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-pill bg-green-soft px-[15px] py-[7px] text-[13px] font-bold text-green">
                <Avatar name={book.child.name} className="h-5 w-5 rounded-full text-[10px]" />
                для {book.child.name}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="#read"
                className="rounded-pill bg-primary px-[30px] py-3.5 font-display text-base font-bold text-white shadow-primary transition hover:-translate-y-0.5"
              >
                📖 Читать книгу
              </a>
              <Link
                href="/dashboard"
                className="rounded-pill border-2 border-[#efe6da] bg-surface px-6 py-3.5 font-display text-base font-bold text-ink-soft transition hover:border-[#d8cabb]"
              >
                На главную
              </Link>
            </div>
          </div>

          {/* reading view — restyled inline pages (full spread reader + PDF arrive in 6.20) */}
          <div id="read" className="mx-auto mt-12 flex max-w-[720px] flex-col gap-8">
            {book.pages.map((page) => (
              <section key={page.id} className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-card">
                {page.illustrations[0]?.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={page.illustrations[0].imageUrl} alt="" className="block w-full" />
                )}
                <p className="px-7 py-6 text-[17px] leading-[1.7]">{resolveSlots(page.text, book.slots)}</p>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
