
import Link from 'next/link'
import {requireRole} from '../../lib/session'
import Logout from '../admin/sair'
export const dynamic='force-dynamic'
const labels:Record<string,string>={entrada:'Entrada',intervalo_inicio:'Início do intervalo',intervalo_fim:'Retorno do intervalo',saida:'Saída'}
const fmt=(date:string)=>new Date(date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})
function brDay(date:string|Date){return new Date(date).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}
function brHour(date:string){return new Date(date).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false})}
type TimeEntry={id:string;kind:string;occurred_at:string;source:string;note:string}
function workingHours(entries:TimeEntry[]){
 const ascending=[...entries].sort((a,b)=>Date.parse(a.occurred_at)-Date.parse(b.occurred_at))
 const daily=new Map<string,number>()
 let started:string|null=null
 for(const e of ascending){
  if(e.kind==='entrada'||e.kind==='intervalo_fim'){started=e.occurred_at}
  if((e.kind==='intervalo_inicio'||e.kind==='saida')&&started){
   const diff=Date.parse(e.occurred_at)-Date.parse(started)
   if(diff>=0&&diff<=18*3600000){const date=brDay(started);daily.set(date,(daily.get(date)||0)+diff)}
   started=null
  }
 }
 return daily
}
export default async function Funcionario(){
 const {supabase,profile,user}=await requireRole(['employee'])
 const {data:staff,error:staffError}=await supabase.from('staff').select('id,full_name,position,employment_type,shift_start').eq('user_id',user.id).maybeSingle()
 const {data:rows,error:entriesError}=staff?await supabase.from('time_entries').select('id,kind,occurred_at,source,note').eq('staff_id',staff.id).order('occurred_at',{ascending:false}).limit(300):{data:[],error:null}
 const entries=(rows||[]) as TimeEntry[]
 const count=entries.filter(e=>e.kind==='entrada').length
 const last=entries[0]
 const hours=workingHours(entries)
 const chart=Array.from({length:7},(_,i)=>{
  const d=new Date();d.setDate(d.getDate()-6+i)
  const ms=hours.get(brDay(d))||0
  return {day:d.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'short'}).replace('.',''),hours:Math.round(ms/3600000*10)/10}
 })
 const max=Math.max(1,...chart.map(c=>c.hours))
 let lateCount=0
 const expected=staff?.shift_start?.slice(0,5)
 if(expected){
  const firsts=new Map<string,string>()
  for(const e of entries.filter(e=>e.kind==='entrada')){
    const d=brDay(e.occurred_at),time=brHour(e.occurred_at)
    if(!firsts.has(d)||time<firsts.get(d)!)firsts.set(d,time)
  }
  lateCount=[...firsts.values()].filter(v=>v>expected).length
 }
 return <div className="employee-shell">
  <header className="employee-header"><div><strong>AGR<span> • PONTO</span></strong><p>Área do funcionário</p></div><Logout/></header>
  <div className="employee-main"><p className="eyebrow">Meu painel</p><h1>Olá, {staff?.full_name||profile.full_name}!</h1><p>Seu histórico de jornada, com acesso exclusivo às suas marcações.</p>
  {(staffError||entriesError)&&<div role="alert" className="alert">Não foi possível consultar os registros.</div>}
  {!staff&&<div className="alert">Sua conta ainda não está vinculada a um cadastro de funcionário. Contate a administração da empresa.</div>}
  <div className="metrics"><div className="metric"><small>Entradas registradas</small><strong>{count}</strong><span>No histórico consultado</span></div><div className="metric"><small>Atrasos estimados</small><strong>{expected?lateCount:'—'}</strong><span>{expected?'Comparados com entrada prevista às '+expected:'Escala não cadastrada'}</span></div><div className="metric"><small>Último registro</small><strong className="metric-date">{last?fmt(last.occurred_at):'—'}</strong><span>{last?labels[last.kind]:'Sem registros'}</span></div></div>
  <section className="panel" style={{marginBottom:18}}><h2>Horas registradas — últimos 7 dias</h2><p>Estimativa calculada apenas com pares de entrada/intervalo/saída disponíveis. Não substitui apuração oficial de jornada.</p><div className="bar-chart">{chart.map((c,i)=><div className="bar-group" key={i}><div className="bar-track"><div className="bar" style={{height:c.hours/max*100+'%'}} title={String(c.hours)+' horas'}/></div><strong>{c.hours}h</strong><span>{c.day}</span></div>)}</div></section>
  <div className="panel"><h2>Histórico de ponto</h2><p>Marcações feitas pelo administrador aparecem identificadas como manuais. Horários seguem o fuso de Brasília.</p>
   <div className="table-wrap"><table><thead><tr><th>Data e hora</th><th>Marcação</th><th>Origem</th><th>Observação</th></tr></thead><tbody>{entries.map(e=><tr key={e.id}><td>{fmt(e.occurred_at)}</td><td>{labels[e.kind]||e.kind}</td><td><span className="pill">{e.source==='manual'?'Manual':'Terminal'}</span></td><td>{e.note||'—'}</td></tr>)}{entries.length===0&&<tr><td colSpan={4}>Nenhum registro cadastrado.</td></tr>}</tbody></table></div>
  </div><div className="notice">O acesso ao terminal de ponto facial será liberado após a integração e homologação da verificação biométrica. Este painel não registra ponto.</div>
  <p><Link href="/inicio">Atualizar painel</Link></p></div></div>
}
