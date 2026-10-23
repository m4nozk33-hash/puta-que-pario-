'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
export default function Logout() {
 const router=useRouter()
 async function logout(){ await createClient().auth.signOut(); router.replace('/login'); router.refresh() }
 return <button type="button" onClick={logout}>Sair</button>
}
