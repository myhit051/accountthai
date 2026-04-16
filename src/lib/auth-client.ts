'use client'

const BASE = process.env.NEXT_PUBLIC_APP_URL || ''

async function authFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  const data = res.ok ? await res.json().catch(() => ({})) : null
  return {
    data,
    error: res.ok ? null : { message: await res.text().catch(() => 'Error') },
  }
}

export const signIn = {
  email: async ({
    email,
    password,
    callbackURL,
  }: {
    email: string
    password: string
    callbackURL?: string
  }) => {
    const result = await authFetch('sign-in/email', { email, password, callbackURL })
    return result
  },
  social: async ({ provider, callbackURL }: { provider: string; callbackURL?: string }) => {
    const result = await authFetch('sign-in/social', { provider, callbackURL: callbackURL || '/' })
    if (result.data && typeof result.data === 'object' && 'url' in result.data && typeof result.data.url === 'string') {
      window.location.href = result.data.url
    }
    return result
  },
}

export const signUp = {
  email: async ({
    email,
    password,
    name,
    callbackURL,
  }: {
    email: string
    password: string
    name: string
    callbackURL?: string
  }) => {
    const result = await authFetch('sign-up/email', { email, password, name, callbackURL })
    return result
  },
}

export async function signOut() {
  await fetch(`${BASE}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  })
}

// Session hook using React state + API call
export { useSession } from './useSession'
