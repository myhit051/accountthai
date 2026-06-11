import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchAdAccounts, MetaTokenError } from '@/lib/meta'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { accessToken } = await request.json()
  if (!accessToken || typeof accessToken !== 'string') {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }

  try {
    const adAccounts = await fetchAdAccounts(accessToken.trim())
    return NextResponse.json({ adAccounts })
  } catch (error) {
    if (error instanceof MetaTokenError) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
    }
    console.error('Meta adaccounts error:', error)
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }
}
