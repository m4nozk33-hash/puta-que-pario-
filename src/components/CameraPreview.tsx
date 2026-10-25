
'use client'
import {useRef,useState,useEffect} from 'react'
export default function CameraPreview(){
 const ref=useRef<HTMLVideoElement>(null)
 const stream=useRef<MediaStream|null>(null)
 const [error,setError]=useState('')
 const [active,setActive]=useState(false)
 function stop(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setActive(false)}
 useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop())},[])
 async function start(){
  try{
   setError('')
   if(!navigator.mediaDevices?.getUserMedia) throw new Error('Câmera indisponível neste dispositivo ou navegador.')
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false})
   stream.current=media
   if(ref.current) {ref.current.srcObject=media;await ref.current.play()}
   setActive(true)
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível abrir a câmera.')}
 }
 return <div className="camera-box"><div className="camera-preview"><video ref={ref} muted playsInline autoPlay style={{display:active?'block':'none'}}/>{!active&&<div className="camera-empty"><span>◎</span><p>Teste de câmera</p></div>}</div><div className="camera-actions"><button type="button" onClick={active?stop:start}>{active?'Desligar câmera':'Testar câmera'}</button><button type="button" disabled title="Biometria ainda não integrada">Registrar ponto (indisponível)</button></div>{error&&<p role="alert" className="alert">{error}</p>}</div>
}
