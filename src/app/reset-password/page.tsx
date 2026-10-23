'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
export default function ResetPassword(){
 const [ready,setReady]=useState(false)
 const [password,setPassword]=useState('')
 const [confirm,setConfirm]=useState('')
 const [message,setMessage]=useState('')
 const [loading,setLoading]=useState(false)
 useEffect(()=>{
  let active=true
  async function check(){
   try{
    const supabase=createClient()
    const code=new URLSearchParams(window.location.search).get('code')
    const hash=new URLSearchParams(window.location.hash.slice(1))
    const tokenHash=new URLSearchParams(window.location.search).get('token_hash')
    if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error)throw error}
    else if(tokenHash){const {error}=await supabase.auth.verifyOtp({token_hash:tokenHash,type:'recovery'});if(error)throw error}
    else if(hash.get('access_token')&&hash.get('refresh_token')){
     const {error}=await supabase.auth.setSession({access_token:hash.get('access_token')!,refresh_token:hash.get('refresh_token')!})
     if(error)throw error
    }
    const {data:{session}}=await supabase.auth.getSession()
    if(active){setReady(Boolean(session));if(!session)setMessage('Link inválido ou expirado. Solicite outro e-mail de recuperação.')}
    if(session)window.history.replaceState({},'',window.location.pathname)
   }catch(e){if(active)setMessage(e instanceof Error?e.message:'Link inválido ou expirado.')}
  }
  void check()
  return ()=>{active=false}
 },[])
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault()
  if(password.length<8){setMessage('Use uma senha com pelo menos 8 caracteres.');return}
  if(password!==confirm){setMessage('As senhas não coincidem.');return}
  setLoading(true);setMessage('')
  try{
   const {error}=await createClient().auth.updateUser({password})
   if(error)throw error
   setReady(false);setMessage('Senha alterada com sucesso. Você já pode entrar.')
   await createClient().auth.signOut()
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível alterar a senha.')}
  finally{setLoading(false)}
 }
 return <main><section className="card"><div className="brand">AGR MARKETING E TECNOLOGIA</div><h1>Redefinir senha</h1>{ready&&<form className="form" onSubmit={submit}><label>Nova senha<input type="password" autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar nova senha<input type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button disabled={loading}>{loading?'Salvando...':'Salvar nova senha'}</button></form>}{message&&<p role="status">{message}</p>}<p><Link href="/login">Voltar ao login</Link></p></section></main>
}
