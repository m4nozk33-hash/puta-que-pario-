'use client'
import {useEffect,useRef,useState} from 'react'
import {createClient} from '../lib/supabase/client'
import GuidedFaceCapture from './GuidedFaceCapture'
type Person={id:string;tenant_id:string;full_name:string;active:boolean}
type Enrollment={staff_id:string;image_path:string;recorded_at:string;recorded_by:string}
export default function FaceEnrollment({person,onClose}:{person:Person;onClose:()=>void}){
 const [preview,setPreview]=useState<string|null>(null)
 const [photo,setPhoto]=useState<Blob|null>(null)
 const [existing,setExisting]=useState<Enrollment|null>(null)
 const [ack,setAck]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [success,setSuccess]=useState('')
 const [loading,setLoading]=useState(true)
 useEffect(()=>{
  let alive=true
  createClient().from('staff_face_enrollments').select('staff_id,image_path,recorded_at,recorded_by').eq('staff_id',person.id).maybeSingle()
    .then(({data,error})=>{if(!alive)return;if(error)setError(error.message);else setExisting(data);setLoading(false)})
  return ()=>{alive=false}
 },[person.id])
 function receive(blob:Blob){if(preview)URL.revokeObjectURL(preview);setPhoto(blob);setPreview(URL.createObjectURL(blob));setError('');setSuccess('Confira a foto capturada antes de salvar.')}
 function reset(){if(preview)URL.revokeObjectURL(preview);setPreview(null);setPhoto(null);setSuccess('')}
 async function save(){
  if(!photo||!ack)return setError('Capture a imagem e confirme que o funcionário foi informado e que o procedimento foi autorizado.')
  setBusy(true);setError('');setSuccess('')
  const sb=createClient()
  const path=person.tenant_id+'/'+person.id+'/face.jpg'
  try{
   const {error:uploadError}=await sb.storage.from('staff-face-private').upload(path,photo,{contentType:'image/jpeg',upsert:true})
   if(uploadError)throw uploadError
   const {data:{user}}=await sb.auth.getUser()
   if(!user)throw Error('Sessão expirada. Faça login novamente.')
   const {error:saveError}=await sb.from('staff_face_enrollments').upsert({staff_id:person.id,tenant_id:person.tenant_id,image_path:path,recorded_by:user.id,acknowledged:true,recorded_at:new Date().toISOString()},{onConflict:'staff_id'})
   if(saveError)throw saveError
   setExisting({staff_id:person.id,image_path:path,recorded_by:user.id,recorded_at:new Date().toISOString()})
   reset();setSuccess('Foto facial cadastrada em armazenamento privado. A identificação biométrica automática ainda não está ativada.')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a foto.')}
  finally{setBusy(false)}
 }
 async function remove(){
  if(!existing||!confirm('Excluir a foto facial cadastrada para este funcionário?'))return
  setBusy(true);setError('');setSuccess('')
  const sb=createClient()
  try{
   const {error:removeError}=await sb.storage.from('staff-face-private').remove([existing.image_path])
   if(removeError)throw removeError
   const {error:recordError}=await sb.from('staff_face_enrollments').delete().eq('staff_id',person.id)
   if(recordError)throw recordError
   setExisting(null);reset();setSuccess('Imagem e registro facial excluídos.')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível excluir a imagem.')}
  finally{setBusy(false)}
 }
 return <div className="panel" style={{marginTop:16,borderColor:'#adc7ef'}}>
  <div className="panel-header"><div><h2>Cadastro facial — {person.full_name}</h2><p>Foto de referência para a futura validação biométrica; ainda não autoriza registro de ponto.</p></div><button type="button" className="mini-button" onClick={()=>{reset();onClose()}}>Fechar</button></div>
  {loading?<p>Consultando cadastro...</p>:<p><strong>Status: </strong>{existing?'Foto facial cadastrada — '+new Date(existing.recorded_at).toLocaleDateString('pt-BR'):'Nenhuma foto facial cadastrada'}</p>}
  <div className="notice">Dados faciais são sensíveis. Antes de coletar, informe a finalidade ao funcionário, defina base legal adequada, prazo de retenção e canal para exclusão. Não use esta foto como reconhecimento facial automático nem como comprovante de ponto.</div>
  <GuidedFaceCapture onCapture={receive}/>
  {preview&&<div style={{maxWidth:320,margin:'14px auto',textAlign:'center'}}><p>Foto de referência para conferência</p><img src={preview} alt="Foto facial capturada" style={{maxWidth:'100%',borderRadius:14}}/><button type="button" className="mini-button" onClick={reset}>Descartar foto</button></div>}
  <label style={{display:'flex',alignItems:'start',gap:10,margin:'15px 0'}}><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/><span>Confirmo que o funcionário foi informado da coleta e que a empresa documentou uma base legal adequada para essa finalidade.</span></label>
  <div className="camera-actions"><button type="button" disabled={busy||!photo||!ack} onClick={save}>{busy?'Processando...':'Salvar foto facial protegida'}</button>{existing&&<button type="button" className="mini-button" disabled={busy} onClick={remove}>Excluir cadastro facial</button>}</div>
  {error&&<div className="alert" role="alert">{error}</div>}{success&&<div className="notice" role="status">{success}</div>}
 </div>
}