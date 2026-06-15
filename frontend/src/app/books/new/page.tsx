import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { createBookAction } from '@/app/actions/books';
import ParagraphSlider from './ParagraphSlider';
import Link from 'next/link';

type Template = { id: string; title: string; description: string };
type Child = { id: string; name: string };

export default async function NewBookPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [templatesRes, childrenRes] = await Promise.all([
    apiFetch('/templates'),
    apiFetch('/children'),
  ]);

  const templates = (await templatesRes.json()) as Template[];
  const children = (await childrenRes.json()) as Child[];

  if (children.length === 0) redirect('/onboarding?step=2');

  return (
    <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Create a new book</h1>
      <form action={createBookAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <label>
          <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>Template</div>
          <select name="templateId" required style={{ width: '100%', padding: '0.5rem' }}>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>
        <label>
          <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>Child</div>
          <select name="childId" required style={{ width: '100%', padding: '0.5rem' }}>
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <ParagraphSlider />
        <button type="submit" style={{ padding: '0.75rem', fontSize: '1rem', cursor: 'pointer' }}>
          Create book
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link href="/dashboard">Cancel</Link>
      </div>
    </main>
  );
}
