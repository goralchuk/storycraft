import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import ChildManager, { type ChildView, type HeroPreview } from './ChildManager';

type Child = {
  id: string;
  name: string;
  birthDate: string | null;
  gender: string | null;
  interests: string[];
  photoUrl: string | null;
};

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { error } = await searchParams;

  const [childrenRes, booksRes] = await Promise.all([
    apiFetch('/children', { cache: 'no-store' }),
    apiFetch('/books', { cache: 'no-store' }),
  ]);
  const children = (childrenRes.ok ? await childrenRes.json() : []) as Child[];
  const books = (booksRes.ok ? await booksRes.json() : []) as { child: { id: string } | null }[];

  const bookCount = (childId: string) =>
    books.filter((b) => b.child?.id === childId).length;

  // Saved-hero previews fetched per child in parallel (small N).
  const heroLists = await Promise.all(
    children.map(async (c) => {
      const res = await apiFetch(`/children/${c.id}/heroes`, { cache: 'no-store' });
      return (res.ok ? await res.json() : []) as HeroPreview[];
    }),
  );

  const views: ChildView[] = children.map((c, i) => ({
    ...c,
    bookCount: bookCount(c.id),
    heroes: heroLists[i],
  }));

  const hadError = error === 'hasbooks' || error === 'upload' ? error : undefined;

  return <ChildManager items={views} hadError={hadError} />;
}
