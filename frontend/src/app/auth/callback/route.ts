import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { signIn } from '@/auth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/login', request.url));
  await signIn('backend-callback', { token, redirectTo: '/dashboard' });
}
