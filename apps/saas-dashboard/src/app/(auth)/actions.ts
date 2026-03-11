'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/config';

export async function login(email: string, password: string) {
  try {
    const session = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!session) {
      return { error: 'Invalid email or password' };
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('better-auth.session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Invalid email or password' };
  }
}

export async function register(
  email: string,
  password: string,
  fullName?: string
) {
  try {
    const user = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
      },
    });

    if (!user) {
      return { error: 'Failed to create account' };
    }

    // Auto sign in after registration
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${user.token}`,
      }),
    });

    if (session?.token) {
      const cookieStore = await cookies();
      cookieStore.set('better-auth.session_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      return { error: 'Email already registered' };
    }
    return { error: 'Failed to create account' };
  }
}

export async function signInWithGoogle() {
  const url = await auth.api.signInSocial({
    body: {
      provider: 'google',
      callbackURL: '/dashboard',
    },
  });

  if (url) {
    redirect(url);
  }
}

export async function signInWithGithub() {
  const url = await auth.api.signInSocial({
    body: {
      provider: 'github',
      callbackURL: '/dashboard',
    },
  });

  if (url) {
    redirect(url);
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('better-auth.session_token');
  redirect('/login');
}
