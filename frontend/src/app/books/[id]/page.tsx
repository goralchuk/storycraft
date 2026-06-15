import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import StatusPoller from './StatusPoller';

type Illustration = { id: string; imageUrl: string | null; featuresChild: boolean };
type Page = { id: string; pageNum: number; text: string | null; illustrations: Illustration[] };
type Book = {
  id: string;
  title: string | null;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  slots: Record<string, string> | null;
  pages: Page[];
  template: { title: string };
  child: { name: string };
};

// Page text is stored slot-tokenized ({{child}}); resolve for display.
function resolveSlots(text: string | null, slots: Record<string, string> | null): string {
  if (!text) return '';
  if (!slots) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => slots[key] ?? `{{${key}}}`);
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  const res = await apiFetch(`/books/${id}`);
  if (res.status === 404) redirect('/dashboard');
  const book = (await res.json()) as Book;

  const inProgress = book.status === 'PENDING' || book.status === 'PROCESSING';

  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <Link href="/dashboard">← Back to dashboard</Link>
      <h1 style={{ marginTop: '1rem' }}>{resolveSlots(book.title, book.slots) || book.template.title}</h1>
      <p style={{ color: '#666' }}>
        For {book.child.name} · status: <strong>{book.status}</strong>
      </p>

      {inProgress && (
        <>
          <p>Generating your book… this page refreshes automatically.</p>
          <StatusPoller />
        </>
      )}

      {book.status === 'FAILED' && (
        <p style={{ color: 'crimson' }}>Generation failed. Please try creating the book again.</p>
      )}

      {book.status === 'DONE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
          {book.pages.map((page) => (
            <section key={page.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
              {page.illustrations[0]?.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={page.illustrations[0].imageUrl}
                  alt=""
                  style={{ width: '100%', borderRadius: '12px', display: 'block' }}
                />
              )}
              <p style={{ marginTop: '0.75rem', lineHeight: 1.7 }}>{resolveSlots(page.text, book.slots)}</p>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
