import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { createDraftAction, submitDraftAction } from '@/app/actions/books';
import Link from 'next/link';

const PAGE_TIERS = [
  { pages: 12, label: '12 pages (included)' },
  { pages: 16, label: '16 pages (+150🪙)' },
  { pages: 20, label: '20 pages (+300🪙)' },
  { pages: 24, label: '24 pages (+450🪙)' },
];

type Template = { id: string; title: string };
type Child = { id: string; name: string };
type Draft = {
  id: string;
  bookType: 'UNIQUE' | 'TEMPLATE';
  childId: string | null;
  pageCount: number | null;
  template: { title: string } | null;
};

const wrap = { padding: '2rem', maxWidth: '500px', margin: '0 auto' } as const;
const col = { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' } as const;
const field = { width: '100%', padding: '0.5rem' } as const;

export default async function NewBookPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const draftRes = await apiFetch('/books/draft', { cache: 'no-store' });
  const draft = (draftRes.ok ? await draftRes.json() : null) as Draft | null;

  // STEP 1 — no paid draft yet: choose type (+ template) and pay.
  if (!draft) {
    const templatesRes = await apiFetch('/templates', { cache: 'no-store' });
    const templates = (await templatesRes.json()) as Template[];
    return (
      <main style={wrap}>
        <h1>New book — step 1</h1>
        <p style={{ color: '#666' }}>Choose a book type. Coins are charged now; you can finish later.</p>
        <form action={createDraftAction} style={col}>
          <label>
            <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>Type</div>
            <select name="bookType" defaultValue="UNIQUE" style={field}>
              <option value="UNIQUE">Unique (500 coins)</option>
              <option value="TEMPLATE">From template (300 coins)</option>
            </select>
          </label>
          <label>
            <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>Template (for template books)</div>
            <select name="templateId" style={field}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
          <button type="submit" style={{ padding: '0.75rem', fontSize: '1rem', cursor: 'pointer' }}>
            Pay & continue
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link href="/dashboard">Cancel</Link>
        </div>
      </main>
    );
  }

  // STEP 2 — configure the paid draft, then generate.
  const childrenRes = await apiFetch('/children', { cache: 'no-store' });
  const children = (await childrenRes.json()) as Child[];
  if (children.length === 0) redirect('/onboarding?step=2');

  return (
    <main style={wrap}>
      <h1>New book — step 2</h1>
      <p style={{ color: '#666' }}>
        {draft.bookType === 'TEMPLATE' ? `Template: ${draft.template?.title ?? '—'}` : 'Unique story'} · paid ✓
      </p>
      <form action={submitDraftAction} style={col}>
        <input type="hidden" name="draftId" value={draft.id} />
        <label>
          <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>Child</div>
          <select name="childId" required defaultValue={draft.childId ?? ''} style={field}>
            <option value="" disabled>Select a child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>Length</div>
          <select
            name="pageCount"
            defaultValue={PAGE_TIERS.some((t) => t.pages === draft.pageCount) ? draft.pageCount! : 12}
            style={field}
          >
            {PAGE_TIERS.map((t) => (
              <option key={t.pages} value={t.pages}>{t.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" style={{ padding: '0.75rem', fontSize: '1rem', cursor: 'pointer' }}>
          Generate book
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link href="/dashboard">Save & exit</Link>
      </div>
    </main>
  );
}
