import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
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

const wrap = { padding: '2rem', maxWidth: '640px', margin: '0 auto' } as const;
const card = { display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '0.75rem' } as const;
const COMPANION_ROLES = ['PET', 'SIBLING', 'FRIEND', 'MAGIC'] as const;

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
    <main style={wrap}>
      <h1>Heroes</h1>
      {error === 'topup' && (
        <p style={{ color: '#b00' }}>No free generations left for that hero — buy 3 more below.</p>
      )}

      {heroes.map((h) => (
        <div key={h.id} style={card}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f0f0f0', overflow: 'hidden', flexShrink: 0 }}>
            {h.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={h.imageUrl} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <div style={{ flex: 1 }}>
            <strong>{h.name}</strong> <span style={{ color: '#888' }}>· {h.role.toLowerCase()}</span>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              {h.freeAttempts} free generation{h.freeAttempts === 1 ? '' : 's'} left · {h.status.toLowerCase()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {h.freeAttempts > 0 ? (
              <form action={generateHeroAction}>
                <input type="hidden" name="childId" value={childId} />
                <input type="hidden" name="heroId" value={h.id} />
                <button type="submit">Generate</button>
              </form>
            ) : (
              <form action={topupHeroAction}>
                <input type="hidden" name="childId" value={childId} />
                <input type="hidden" name="heroId" value={h.id} />
                <button type="submit">Buy 3 (100🪙)</button>
              </form>
            )}
            {h.role !== 'MAIN' && (
              <form action={removeHeroAction}>
                <input type="hidden" name="childId" value={childId} />
                <input type="hidden" name="heroId" value={h.id} />
                <button type="submit" style={{ color: '#b00' }}>Remove</button>
              </form>
            )}
          </div>
        </div>
      ))}

      {!atLimit && (
        <form action={addCompanionAction} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.5rem' }}>
          <input type="hidden" name="childId" value={childId} />
          <input name="name" placeholder="Companion name" required style={{ padding: '0.5rem', flex: 1 }} />
          <select name="role" style={{ padding: '0.5rem' }}>
            {COMPANION_ROLES.map((r) => (
              <option key={r} value={r}>{r.toLowerCase()}</option>
            ))}
          </select>
          <button type="submit">Add companion (100🪙)</button>
        </form>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Link href="/dashboard">← Back to dashboard</Link>
      </div>
    </main>
  );
}
