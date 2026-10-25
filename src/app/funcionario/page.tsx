
import Link from 'next/link'
import {requireRole} from '../../lib/session'
import Logout from '../admin/sair'
export const dynamic='force-dynamic'
const labels:Record<string,string>={entrada:'Entrada',intervalo_inicio:'Início do intervalo',intervalo_fim:'Retorno do intervalo',saida:'Saída'}
const fmt=(date:string)=>new Date(date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})
export default async function Funcionario(){
 const {supabase,profile,user}=await requireRole(['employee'])
 const {data:staff,error:staffError}=await supabase.from('staff').select('id,full_name,position,employment_type,shift_start').eq('user_id',user.id).maybeSingle()
 const {data:entries,error:entriesError}=staff?await supabase.from('time_entries').select('id,kind,occurred_at,source,note').eq('staff_id',staff.id).order('occurred_at',{ascending:false}).limit(150):{data:[],error:null}
 const count=(entries||[]).filter(e=>e.kind==='entrada').length
 const last=entries?.[0]
 return <div className="employee-shell">
  <header className="employee-header"><div><strong>AGR<span> • PONTO</span></strong><p>Área do funcionário</p></div><Logout/></header>
  <div className="employee-main"><p className="eyebrow">Meu painel</p><h1>Olá, {staff?.full_name||profile.full_name}!</h1><p>Seu histórico de jornada, com acesso exclusivo às suas marcações.</p>
  {(staffError||entriesError)&&<div role="alert" className="alert">Não foi possível consultar os registros.</div>}
  {!staff&&<div className="alert">Sua conta ainda não está vinculada a um cadastro de funcionário. Contate a administração da empresa.</div>}
  <div className="metrics"><div className="metric"><small>Marcações de entrada</small><strong>{count}</strong><span>No histórico carregado</span></div><div className="metric"><small>Último registro</small><strong className="metric-date">{last?fmt(last.occurred_at):'—'}</strong><span>{last?labels[last.kind]:'Sem registros'}</span></div><div className="metric"><small>Função</small><strong className="metric-date">{staff?.position||'—'}</strong><span>{staff?.employment_type==='freelancer'?'Freelancer':'Funcionário'}</span></div></div>
  <div className="panel"><h2>Histórico de ponto</h2><p>Marcações feitas pelo administrador aparecem identificadas como manuais. Horários seguem o fuso de Brasília.</p>
   <div className="table-wrap"><table><thead><tr><th>Data e hora</th><th>Marcação</th><th>Origem</th><th>Observação</th></tr></thead><tbody>{(entries||[]).map(e=><tr key={e.id}><td>{fmt(e.occurred_at)}</td><td>{labels[e.kind]||e.kind}</td><td><span className="pill">{e.source==='manual'?'Manual':'Terminal'}</span></td><td>{e.note||'—'}</td></tr>)}{!entries?.length&&<tr><td colSpan={4}>Nenhum registro cadastrado.</td></tr>}</tbody></table></div>
  </div><div className="notice">O acesso ao terminal de ponto facial será liberado após a integração e homologação da verificação biométrica. Este painel não registra ponto.</div>
  <p><Link href="/inicio">Atualizar painel</Link></p></div></div>
}
