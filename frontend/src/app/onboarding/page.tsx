import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { updateNameAction, addChildAction, skipChildAction } from '@/app/actions/onboarding';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { step } = await searchParams;
  const isStep2 = step === '2';

  if (!isStep2) {
    const res = await apiFetch('/users/me');
    const user = (await res.json()) as { name: string | null };
    if (user.name) redirect('/dashboard');
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem' }}>
      {!isStep2 ? (
        <>
          <h1>Welcome to StoryCraft</h1>
          <p>What should we call you?</p>
          <form action={updateNameAction} style={{ display: 'flex', gap: '0.5rem' }}>
            <input name="name" placeholder="Your name" required autoFocus style={{ padding: '0.5rem', fontSize: '1rem' }} />
            <button type="submit" style={{ padding: '0.5rem 1rem' }}>Continue →</button>
          </form>
        </>
      ) : (
        <>
          <h1>Add your first child</h1>
          <p>Tell us about the child this book is for.</p>
          <form action={addChildAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '300px' }}>
            <input name="name" placeholder="Child's name" required autoFocus style={{ padding: '0.5rem' }} />
            <input name="birthDate" type="date" style={{ padding: '0.5rem' }} />
            <select name="gender" style={{ padding: '0.5rem' }}>
              <option value="">Gender (optional)</option>
              <option value="male">Boy</option>
              <option value="female">Girl</option>
              <option value="other">Other</option>
            </select>
            <input name="interests" placeholder="Interests, e.g. space, cats, dinosaurs" style={{ padding: '0.5rem' }} />
            <button type="submit" style={{ padding: '0.5rem 1rem' }}>Let's go!</button>
          </form>
          <form action={skipChildAction}>
            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#666' }}>
              Skip for now
            </button>
          </form>
        </>
      )}
    </main>
  );
}
