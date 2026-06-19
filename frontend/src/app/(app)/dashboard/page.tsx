import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { logoutAction } from '@/app/actions/auth';
import Link from 'next/link';

type Book = {
  id: string;
  status: string;
  createdAt: string;
  template: { title: string };
  child: { name: string };
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userRes = await apiFetch('/users/me');
  // Distinguish "auth/backend failure" from "genuinely new user". Treating a
  // non-OK response as a nameless user wrongly sends existing users to onboarding.
  // Render an escape hatch (sign out) instead of a dead-end or a redirect loop.
  if (!userRes.ok) {
    return (
      <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h1>Session problem</h1>
        <p style={{ color: '#666' }}>
          Couldn&apos;t load your profile (/users/me returned {userRes.status}). Your session may be
          stale (e.g. the backend&apos;s JWT secret changed). Sign out and sign in again.
        </p>
        <form action={logoutAction} style={{ marginTop: '1.5rem' }}>
          <button type="submit" style={{ padding: '0.75rem 2rem', fontSize: '1rem', cursor: 'pointer' }}>
            Sign out
          </button>
        </form>
      </main>
    );
  }
  const user = (await userRes.json()) as { name: string | null; email: string };
  if (!user.name) redirect('/onboarding');

  const [booksRes, draftRes, childrenRes] = await Promise.all([
    apiFetch('/books', { cache: 'no-store' }),
    apiFetch('/books/draft', { cache: 'no-store' }),
    apiFetch('/children', { cache: 'no-store' }),
  ]);
  const books = (await booksRes.json()) as Book[];
  const draft = (draftRes.ok ? await draftRes.json() : null) as { id: string } | null;
  const children = (childrenRes.ok ? await childrenRes.json() : []) as { id: string; name: string }[];

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Hi, {user.name}</h1>
        <form action={logoutAction}>
          <button type="submit">Sign out</button>
        </form>
      </div>

      {draft && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', marginBottom: '1.5rem', background: '#fff6e6', border: '1px solid #f0c674', borderRadius: '8px' }}>
          <span>You have a book in progress (paid).</span>
          <Link href="/books/new">
            <button style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Continue draft</button>
          </Link>
        </div>
      )}

      {children.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem' }}>Children & heroes</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {children.map((c) => (
              <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span>{c.name}</span>
                <Link href={`/children/${c.id}/heroes`}>Manage heroes →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>You haven&apos;t created any books yet.</p>
          <Link href="/books/new">
            <button style={{ padding: '0.75rem 2rem', fontSize: '1rem', cursor: 'pointer' }}>
              Create your first book
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Link href="/books/new">
              <button style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>+ New book</button>
            </Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Template</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Child</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>
                    <Link href={`/books/${book.id}`}>{book.template.title}</Link>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{book.child.name}</td>
                  <td style={{ padding: '0.5rem' }}>{book.status}</td>
                  <td style={{ padding: '0.5rem' }}>{new Date(book.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
