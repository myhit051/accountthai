'use client'

import { useEffect, useState } from 'react'

interface SessionUser {
  id: string
  name: string
  email: string
  image?: string
}
interface SessionData {
  user: SessionUser
  session: { id: string; expiresAt: number }
}

let cachedSession: SessionData | null | undefined = undefined

export function useSession() {
  const [data, setData] = useState<SessionData | null | undefined>(cachedSession)
  const [isPending, setIsPending] = useState(cachedSession === undefined)

  useEffect(() => {
    if (cachedSession !== undefined) {
      setData(cachedSession)
      setIsPending(false)
      return
    }
    fetch('/api/auth/get-session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(session => {
        cachedSession = session
        setData(session)
        setIsPending(false)
      })
      .catch(() => {
        cachedSession = null
        setData(null)
        setIsPending(false)
      })
  }, [])

  return { data, isPending }
}
