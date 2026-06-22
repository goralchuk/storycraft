import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import Reader from './Reader';

type Illustration = { id: string; imageUrl: string | null };
type PageLayout = 'IMAGE_ONLY' | 'IMAGE_TEXT' | 'TEXT_ONLY';
type Page = { id: string; pageNum: number; text: string | null; layout: PageLayout; illustrations: Illustration[] };
type Book = {
  id: string;
  title: string | null;
  status: string;
  slots: Record<string, string> | null;
  pdfUrl: string | null;
  pages: Page[];
  template: { title: string; icon: string | null; coverColor: string | null } | null;
  topic: { icon: string; label: string } | null;
  child: { name: string } | null;
};

// Page text is stored slot-tokenized ({{child}}); resolve for display.
function resolveSlots(text: string | null, slots: Record<string, string> | null): string {
  if (!text) return '';
  if (!slots) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => slots[key] ?? `{{${key}}}`);
}

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  const res = await apiFetch(`/books/${id}`);
  if (res.status === 404) redirect('/dashboard');
  const book = (await res.json()) as Book;

  // The reader is for finished books only; otherwise show the generation screen.
  if (book.status !== 'DONE') redirect(`/books/${id}`);

  const subject = book.template?.title ?? book.topic?.label ?? 'Сказка';
  const title = resolveSlots(book.title, book.slots) || (book.child ? `${book.child.name} · ${subject}` : subject);
  const spreads = book.pages.map((p) => ({
    text: resolveSlots(p.text, book.slots),
    imageUrl: p.illustrations[0]?.imageUrl ?? null,
    layout: p.layout,
  }));

  return (
    <Reader
      title={title}
      cover={{ color: book.template?.coverColor ?? null, emoji: book.template?.icon ?? book.topic?.icon ?? '📖' }}
      childName={book.child?.name ?? null}
      spreads={spreads}
      pdfUrl={book.pdfUrl}
    />
  );
}
