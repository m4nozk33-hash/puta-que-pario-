
import {redirect} from 'next/navigation'
import {serverSupabase} from '../../lib/supabase/server'
export const dynamic='force-dynamic'
export default async function Inicio(){
 const sb=await serverSupabase()
 const {data:{user}}=await sb.auth.getUser()
 if(!user) redirect('/login')
 const {data:p}=await sb.from('profiles').select('role,active').eq('id',user.id).maybeSingle()
 if(!p || !p.active) redirect('/ativar')
 if(p.role==='agr_admin') redirect('/admin')
 if(p.role==='company_admin'||p.role==='hr') redirect('/empresa')
 if(p.role==='employee') redirect('/funcionario')
 redirect('/login')
}
