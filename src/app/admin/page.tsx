
import Dashboard from '../../components/Dashboard'
import {requireRole} from '../../lib/session'
export const dynamic='force-dynamic'
export default async function Admin(){
 const {user,profile}=await requireRole(['agr_admin'])
 return <Dashboard scope="agr" actorId={user.id} actorName={profile.full_name||user.email||'Administrador AGR'}/>
}
