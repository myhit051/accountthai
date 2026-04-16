import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'

async function handler(req: NextRequest) {
  return auth.handler(req)
}

export { handler as GET, handler as POST }
