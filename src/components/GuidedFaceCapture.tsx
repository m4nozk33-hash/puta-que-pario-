'use client'
import {useEffect,useRef,useState} from 'react'
const steps=['Centralize o rosto','Vire o rosto suavemente para a direita','Vire o rosto suavemente para a esquerda','Olhe novamente para a câmera']
export default function GuidedFaceCapture({onCapture}:{onCapture?:(file:Blob)=>void}){
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null)
 const [active,setActive]=useState(false),[step,setStep]=useState(0),[error,setError]=useState(''),[done,setDone]=useState(false)
 const [busy,setBusy]=useState(false)
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setActive(false)}
 useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop())},[])
 async function start(){
  setError('');setDone(false);setStep(0)
  try{
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:720}},audio:false})
   stream.current=media
   if(video.current){video.current.srcObject=media;await video.current.play()}
   setActive(true)
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível abrir a câmera.');stop()}
 }
 async function advance(){
  if(step<steps.length-1)return setStep(step+1)
  if(!onCapture){stop();setDone(true);return}
  if(!video.current)return
  setBusy(true)
  try{
   const v=video.current,c=document.createElement('canvas')
   if(!v.videoWidth)throw Error('Aguarde a câmera carregar.')
   c.width=640;c.height=Math.round(640*v.videoHeight/v.videoWidth)
   const ctx=c.getContext('2d');if(!ctx)throw Error('Captura não suportada.')
   ctx.drawImage(v,0,0,c.width,c.height)
   const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve,'image/jpeg',.78))
   if(!blob||blob.size>1048576)throw Error('Foto acima de 1 MB ou inválida.')
   onCapture(blob);stop();setDone(true)
  }catch(e){setError(e instanceof Error?e.message:'Erro ao capturar foto.')}
  finally{setBusy(false)}
 }
 return <section className="face-flow" aria-label="Guia de captura facial">
  <div className="face-top"><strong>AGR <span>PONTO</span></strong><small>{onCapture?'Cadastro facial':'Validação facial — demonstração'}</small></div>
  <div className="face-steps">{steps.map((_,i)=><span key={i} className={i<=step?'active':''}/>)}</div>
  <div className="face-window"><video ref={video} playsInline muted autoPlay style={{display:active?'block':'none'}}/><div className="face-oval"/>{!active&&<div className="face-idle"><span>◎</span>{done?'Orientação concluída':'Prepare o rosto para a câmera'}</div>}</div>
  <div className="face-caption"><small>ETAPA {step+1} DE {steps.length}</small><h3>{done?'Etapas encerradas':steps[step]}</h3><p>{onCapture?'As instruções são guiadas. A foto de referência será capturada ao final.':'Este é apenas o visual do procedimento. Nenhuma identidade é validada e nenhum ponto será registrado.'}</p></div>
  <div className="face-buttons">{!active?<button type="button" onClick={start}>{done?'Recomeçar':'Iniciar câmera'}</button>:<><button type="button" className="face-outline" onClick={stop}>Cancelar</button><button type="button" disabled={busy} onClick={advance}>{step===steps.length-1?(onCapture?'Capturar foto':'Concluir guia'):'Continuar'}</button></>}</div>
  {error&&<div className="alert" role="alert">{error}</div>}
  <div className="face-warning">Guia visual apenas: não faz reconhecimento 3D, detecção automática de movimento, comparação de identidade ou prova de vida.</div>
 </section>
}
