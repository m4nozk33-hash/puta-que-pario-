'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {createClient} from '../lib/supabase/client'

export default function Activate(){
 const router=useRouter()
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [logged,setLogged]=useState(false)
 const [msg,setMsg]=useState('')
 const [busy,setBusy]=useState(false)
 useEffect(()=>{createClient().auth.getUser().then(({data})=>setLogged(Boolean(data.user))).catch(()=>{})},[])
 async function accept(){
  setBusy(true);setMsg('')
  const {error}=await createClient().rpc('accept_invite')
  if(error){setMsg(error.message);setBusy(false);return}
  router.replace('/inicio');router.refresh()
 }
 async function signup(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMsg('')
  const {error}=await createClient().auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:window.location.origin+'/login'}})
  if(error)setMsg(error.message)
  else setMsg('Confira a caixa de e-mail e confirme seu endereço. Depois entre em /login usando sua senha. O vínculo com a empresa será realizado automaticamente.')
  setBusy(false)
 }
 return <main><section className="auth-card"><div className="brand">AGR MARKETING E TECNOLOGIA</div><h1>Ativar acesso</h1><p>Se o administrador já informou seu e-mail e uma senha provisória, não cadastre novamente: confirme seu e-mail e entre pela tela de login. O sistema vinculará sua conta automaticamente à empresa.</p>
 {logged?<><p>Você está conectado. Conclua a vinculação com a empresa.</p><button onClick={accept} disabled={busy}>{busy?'Ativando...':'Ativar meu convite'}</button></>
 :<form onSubmit={signup} className="form"><label>E-mail convidado<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Crie uma senha (mínimo de 8 caracteres)<input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>{busy?'Enviando...':'Criar conta com convite'}</button></form>}
 {msg&&<div className="notice" role="status">{msg}</div>}<p><Link href="/login">Voltar ao login</Link></p></section></main>
}
