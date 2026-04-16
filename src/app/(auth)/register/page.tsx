'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth-client'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    setLoading(true)
    try {
      const result = await signUp.email({ email, password, name, callbackURL: '/' })
      if (result.error) {
        setError('อีเมลนี้มีผู้ใช้งานแล้ว กรุณาใช้อีเมลอื่น')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signIn.social({ provider: 'google', callbackURL: '/' })
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-500 rounded-2xl mb-4 shadow-lg shadow-teal-500/40">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">สมัครใช้งาน</h1>
        <p className="text-blue-200 text-sm mt-1">เริ่มต้นใช้งาน AccountThai ฟรี</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { id: 'name', label: 'ชื่อ-นามสกุล', type: 'text', value: name, setter: setName, placeholder: 'ชื่อของคุณ' },
          { id: 'reg-email', label: 'อีเมล', type: 'email', value: email, setter: setEmail, placeholder: 'your@email.com' },
          { id: 'reg-password', label: 'รหัสผ่าน (อย่างน้อย 8 ตัว)', type: 'password', value: password, setter: setPassword, placeholder: '••••••••' },
        ].map(f => (
          <div key={f.id}>
            <label className="block text-sm font-medium text-blue-100 mb-1.5">{f.label}</label>
            <input
              id={f.id}
              type={f.type}
              className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              required
            />
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          id="register-submit"
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 disabled:opacity-60 mt-2"
        >
          {loading ? <><div className="spinner w-4 h-4" /> กำลังสมัคร...</> : 'สมัครใช้งาน'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 text-blue-200 bg-blue-900/40 rounded-full">หรือ</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-white text-gray-800 hover:bg-gray-50 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          <path d="M1 1h22v22H1z" fill="none"/>
        </svg>
        สมัครใช้งานด้วย Google
      </button>

      <p className="text-center text-blue-200 text-sm mt-6">
        มีบัญชีแล้ว?{' '}
        <Link href="/login" className="text-white font-medium hover:underline">เข้าสู่ระบบ</Link>
      </p>
    </div>
  )
}
