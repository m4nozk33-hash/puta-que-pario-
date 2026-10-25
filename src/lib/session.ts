
import { redirect } from 'next/navigation'
import { serverSupabase } from './supabase/server'
export type Role='agr_admin'|'company_admin'|'hr'|'employee'
export async function requireRole(allowed:Role[]) {
  const supabase=await serverSupabase()
  const {data:{user},error}=await supabase.auth.getUser()
  if(error || !user) redirect('/login')
  const {data:profile,error:profileError}=await supabase.from('profiles').select('id,role,tenant_id,full_name,active').eq('id',user.id).maybeSingle()
  if(profileError || !profile || !profile.active) redirect('/ativar')
  if(!allowed.includes(profile.role as Role)) redirect('/inicio')
  return {supabase,user,profile}
}
