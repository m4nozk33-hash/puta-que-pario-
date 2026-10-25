
import Dashboard from '../../components/Dashboard'
import {requireRole} from '../../lib/session'
export const dynamic='force-dynamic'
export default async function Empresa(){
 const {user,profile}=await requireRole(['company_admin','hr'])
 if(!profile.tenant_id) return <main><div className="auth-card"><h1>Empresa não vinculada</h1><p>Solicite à AGR a vinculação de sua conta.</p></div></main>
 return <Dashboard scope="company" tenantId={profile.tenant_id} actorId={user.id} actorName={profile.full_name||user.email||'Administração'} canInvite={profile.role==='company_admin'}/>
}
