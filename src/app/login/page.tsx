'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.replace('/inicio')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally { setLoading(false) }
  }
  return <main><section className="card"><div className="brand">AGR MARKETING E TECNOLOGIA</div><h1>Entrar no AGR Ponto Inteligente</h1><p>Acesso seguro ao painel administrativo.</p><form onSubmit={submit} className="form"><label>E-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label><label>Senha<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<button disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button></form><p><Link href="/forgot-password">Esqueci minha senha</Link> · <Link href="/ativar">Recebi um convite</Link></p></section></main>
}
