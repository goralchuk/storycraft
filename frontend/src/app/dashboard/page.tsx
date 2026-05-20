import { auth } from '@/auth';
import { logoutAction } from '@/app/actions/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>Signed in as {session?.user?.email}</p>
      <form action={logoutAction} style={{ marginTop: '1rem' }}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
