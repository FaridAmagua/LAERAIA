'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function submit(): Promise<void> {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username, password }),
      })

      if (!response.ok) {
        setMessage('Invalid admin credentials')
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <label className="block space-y-2 text-sm text-slate-200">
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
        />
      </label>

      <label className="mt-3 block space-y-2 text-sm text-slate-200">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
        />
      </label>

      <label className="mt-3 block space-y-2 text-sm text-slate-200">
        <span>ADMIN_TOKEN (optional)</span>
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
        />
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-3 rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
      >
        {loading ? 'Checking...' : 'Login'}
      </button>

      {message && <p className="mt-2 text-xs text-rose-300">{message}</p>}
    </div>
  )
}
