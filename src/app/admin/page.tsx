import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Logout from './sair'

export const dynamic = 'force-dynamic'
export default async function Admin() {
  const jar = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return <main><section className="card"><h1>Configuração pendente</h1><p>Configure as variáveis públicas do Supabase no ambiente de implantação.</p></section></main>
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll() },
      setAll(items: { name: string; value: string; options?: Parameters<typeof jar.set>[2] }[]) { try { items.forEach(({ name, value, options }) => jar.set(name, value, options)) } catch {} }
    }
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role, full_name').eq('id',user.id).single()
  if (profileError || profile?.role !== 'agr_admin') return <main><section className="card"><h1>Acesso não autorizado</h1><p>Este usuário não possui perfil de administrador AGR.</p><Logout /></section></main>
  return <main><section className="card"><div className="brand">AGR MARKETING E TECNOLOGIA</div><h1>Painel administrativo</h1><span className="tag">Administrador AGR</span><p>Bem-vindo, {profile.full_name || user.email}. O acesso foi validado pelo Supabase.</p><div className="notice">Primeira etapa: autenticação e autorização. Cadastros de empresas, funcionários e marcações serão implementados nas próximas etapas.</div><Logout /></section></main>
}
