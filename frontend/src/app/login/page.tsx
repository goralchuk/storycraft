import { googleLoginAction, stubLoginAction } from '@/app/actions/auth';

const isStub = process.env.STUB_AUTH === 'true';

export default function LoginPage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <h1>StoryCraft</h1>
      <form action={googleLoginAction}>
        <button type="submit">Sign in with Google</button>
      </form>
      {isStub && (
        <form action={stubLoginAction}>
          <button type="submit">Sign in as test user (dev)</button>
        </form>
      )}
    </main>
  );
}
