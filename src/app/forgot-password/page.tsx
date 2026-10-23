'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
export default function ForgotPassword() {
 const [email,setEmail]=useState('')
 const [message,setMessage]=useState('')
 const [loading,setLoading]=useState(false)
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setLoading(true);setMessage('')
  try {
   const {error}=await createClient().auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password'})
   if(error) throw error
   setMessage('Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.')
  } catch(e){setMessage(e instanceof Error?e.message:'Não foi possível solicitar a recuperação.')}
  finally{setLoading(false)}
 }
 return <main><section className="card"><div className="brand">AGR MARKETING E TECNOLOGIA</div><h1>Recuperar senha</h1><form className="form" onSubmit={submit}><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label><button disabled={loading}>{loading?'Enviando...':'Enviar link de recuperação'}</button></form>{message&&<p role="status">{message}</p>}<p><Link href="/login">Voltar ao login</Link></p></section></main>
}
