'use client'
import {useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {createClient} from '../../lib/supabase/client'

export default function Login(){
 const router=useRouter()
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [error,setError]=useState('')
 const [message,setMessage]=useState('')
 const [loading,setLoading]=useState(false)
 const [needsConfirmation,setNeedsConfirmation]=useState(false)

 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setLoading(true);setError('');setMessage('');setNeedsConfirmation(false)
  const sb=createClient()
  try{
   const identifier=email.trim().toLowerCase()
   let authLogin=identifier
   if(!identifier.includes('@')){
    const {data:resolved,error:lookupError}=await sb.rpc('resolve_staff_login',{p_identifier:identifier})
    if(lookupError||!resolved)throw new Error('Nome de usuário não encontrado ou conta ainda não ativada.')
    authLogin=resolved
   }
   let {error:signInError}=await sb.auth.signInWithPassword({email:authLogin,password})
   if(signInError&&identifier.includes('@')&&!/email not confirmed|not confirmed/i.test(signInError.message)){
    const {data:resolved}=await sb.rpc('resolve_staff_login',{p_identifier:identifier})
    if(resolved){
      const attempt=await sb.auth.signInWithPassword({email:resolved,password})
      signInError=attempt.error
    }
   }
   if(signInError){
    if(/email not confirmed|not confirmed/i.test(signInError.message)){
     setNeedsConfirmation(true)
     throw new Error('Seu e-mail ainda não foi confirmado. Abra a mensagem enviada ao Gmail ou solicite um novo envio abaixo.')
    }
    throw signInError
   }
   const {data:{user}}=await sb.auth.getUser()
   if(!user)throw new Error('Não foi possível confirmar o login. Tente novamente.')
   const {data:profile,error:profileError}=await sb.from('profiles').select('id,active').eq('id',user.id).maybeSingle()
   if(profileError)throw profileError
   if(!profile){
    const {error:activationError}=await sb.rpc('accept_invite')
    if(activationError){
     throw new Error('Seu login funcionou, mas a vinculação com a empresa ainda está pendente: '+activationError.message+'. Confira o convite com o administrador.')
    }
   }else if(!profile.active){
    throw new Error('Seu acesso está inativo. Procure o administrador da empresa.')
   }
   router.replace('/inicio');router.refresh()
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível entrar.')}
  finally{setLoading(false)}
 }
 async function resend(){
  if(!email.trim()){setError('Informe o e-mail cadastrado para reenviar a confirmação.');return}
  setLoading(true);setError('');setMessage('')
  try{
   const {error}=await createClient().auth.resend({type:'signup',email:email.trim().toLowerCase(),options:{emailRedirectTo:window.location.origin+'/login'}})
   if(error)throw error
   setMessage('Se a conta estiver aguardando confirmação, um novo link será enviado ao e-mail informado. Confira também o spam.')
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível reenviar o link.')}
  finally{setLoading(false)}
 }
 return <main><section className="card">
  <div className="brand">AGR MARKETING E TECNOLOGIA</div>
  <h1>Entrar no AGR Ponto Inteligente</h1>
  <p>Entre com nome de usuário ou e-mail e senha. Se vários funcionários compartilham o mesmo e-mail, utilize o usuário individual.</p>
  <form onSubmit={submit} className="form">
   <label>E-mail ou nome de usuário<input type="text" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label>Senha<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   {error&&<p role="alert" className="alert">{error}</p>}
   {message&&<p role="status" className="notice">{message}</p>}
   <button disabled={loading}>{loading?'Entrando...':'Entrar'}</button>
  </form>
  {needsConfirmation&&<button type="button" disabled={loading} onClick={resend}>Reenviar confirmação de e-mail</button>}
  <p><Link href="/forgot-password">Esqueci minha senha</Link> · <Link href="/ativar">Recebi um convite</Link></p>
 </section></main>
}
