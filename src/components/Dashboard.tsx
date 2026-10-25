
'use client'
import {useCallback,useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import {createClient} from '../lib/supabase/client'
import {createRegistrationClient} from '../lib/supabase/registration'
import Logout from '../app/admin/sair'

type Scope='agr'|'company'
type Tenant={id:string;name:string;slug:string;status:string}
type Staff={id:string;tenant_id:string;full_name:string;employee_code:string|null;position:string;employment_type:string;shift_start:string|null;shift_end:string|null;active:boolean;user_id:string|null;username:string|null;contact_email:string|null}
type Entry={id:string;tenant_id:string;staff_id:string;kind:string;occurred_at:string;created_at:string;created_by:string;source:string;note:string}
type Invite={id:string;tenant_id:string;email:string;full_name:string|null;role:string;created_at:string;accepted_at:string|null}
type View='inicio'|'empresas'|'clientes'|'funcionarios'|'lancar'|'historico'|'convites'|'configuracoes'
const positionText:Record<string,string>={garcom:'Garçom',cozinha:'Cozinha',cumim:'Cumim',outro:'Outra função'}
const kindText:Record<string,string>={entrada:'Entrada',intervalo_inicio:'Início do intervalo',intervalo_fim:'Fim do intervalo',saida:'Saída'}
const nav:{key:View;label:string;icon:string}[]=[
 {key:'inicio',label:'Visão geral',icon:'▦'},{key:'empresas',label:'Empresas',icon:'▣'},
 {key:'clientes',label:'Clientes',icon:'◇'},{key:'funcionarios',label:'Funcionários',icon:'♙'},
 {key:'lancar',label:'Lançar ponto',icon:'◷'},{key:'historico',label:'Histórico',icon:'☷'},
 {key:'convites',label:'Acessos e convites',icon:'✉'},{key:'configuracoes',label:'Configurações',icon:'⚙'}
]
const fDate=(s:string)=>new Date(s).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})
const localNow=()=>{
 const d=new Date(); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)
}
function validTenant(t:string){return /^[a-z0-9][a-z0-9-]{2,39}$/.test(t)}
export default function Dashboard({scope,tenantId,actorId,actorName,canInvite=true}:{scope:Scope;tenantId?:string;actorId:string;actorName:string;canInvite?:boolean}){
 const [view,setView]=useState<View>('inicio')
 const [tenants,setTenants]=useState<Tenant[]>([])
 const [staff,setStaff]=useState<Staff[]>([])
 const [entries,setEntries]=useState<Entry[]>([])
 const [invites,setInvites]=useState<Invite[]>([])
 const [selectedTenant,setSelectedTenant]=useState('all')
 const [formTenant,setFormTenant]=useState(tenantId||'')
 const [busy,setBusy]=useState(false)
 const [loading,setLoading]=useState(true)
 const [notice,setNotice]=useState('')
 const [error,setError]=useState('')
 const isAgr=scope==='agr'
 const reload=useCallback(async()=>{
  const sb=createClient()
  const a=isAgr?sb.from('tenants').select('id,name,slug,status').order('name'):sb.from('tenants').select('id,name,slug,status').eq('id',tenantId!)
  const b=isAgr?sb.from('staff').select('id,tenant_id,full_name,employee_code,position,employment_type,shift_start,shift_end,active,user_id,username,contact_email').order('full_name'):
    sb.from('staff').select('id,tenant_id,full_name,employee_code,position,employment_type,shift_start,shift_end,active,user_id,username,contact_email').eq('tenant_id',tenantId!).order('full_name')
  const c=isAgr?sb.from('time_entries').select('id,tenant_id,staff_id,kind,occurred_at,created_at,created_by,source,note').order('occurred_at',{ascending:false}).limit(500):
    sb.from('time_entries').select('id,tenant_id,staff_id,kind,occurred_at,created_at,created_by,source,note').eq('tenant_id',tenantId!).order('occurred_at',{ascending:false}).limit(500)
  const d=canInvite?(isAgr?sb.from('account_invites').select('id,tenant_id,email,full_name,role,created_at,accepted_at').order('created_at',{ascending:false}).limit(100):
    sb.from('account_invites').select('id,tenant_id,email,full_name,role,created_at,accepted_at').eq('tenant_id',tenantId!).order('created_at',{ascending:false}).limit(100)):null
  const [t,s,e,i]=await Promise.all([a,b,c,d??Promise.resolve({data:[],error:null})])
  const firstError=[t.error,s.error,e.error,i.error].find(Boolean)
  if(firstError)throw new Error(firstError.message)
  setTenants((t.data||[]) as Tenant[])
  setStaff((s.data||[]) as Staff[])
  setEntries((e.data||[]) as Entry[])
  setInvites((i.data||[]) as Invite[])
 },[isAgr,tenantId,canInvite])
 useEffect(()=>{let alive=true;reload().catch(err=>{if(alive)setError(err instanceof Error?err.message:'Erro ao consultar dados')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[reload])
 const tenantName=(id:string)=>tenants.find(t=>t.id===id)?.name||'Empresa'
 const staffName=(id:string)=>staff.find(s=>s.id===id)?.full_name||'Funcionário'
 const shownStaff=useMemo(()=>staff.filter(s=>selectedTenant==='all'||s.tenant_id===selectedTenant),[staff,selectedTenant])
 const shownEntries=useMemo(()=>entries.filter(e=>selectedTenant==='all'||e.tenant_id===selectedTenant),[entries,selectedTenant])
 const shownTenants=useMemo(()=>tenants.filter(t=>selectedTenant==='all'||t.id===selectedTenant),[tenants,selectedTenant])
 const currentTenant=formTenant||(scope==='company'?tenantId||'':'')
 const employeesForForm=staff.filter(s=>s.tenant_id===currentTenant&&s.active)
 async function run(action:()=>Promise<void>){
  setBusy(true);setError('');setNotice('')
  try{await action();await reload()}catch(err){setError(err instanceof Error?err.message:'Operação não concluída')}
  finally{setBusy(false)}
 }
 async function addTenant(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const f=new FormData(e.currentTarget)
  const name=String(f.get('name')||'').trim(),slug=String(f.get('slug')||'').trim().toLowerCase()
  if(name.length<2||!validTenant(slug)){setError('Informe um nome e um código de empresa com 3 a 40 caracteres, letras minúsculas, números ou hífen.');return}
  const form=e.currentTarget
  await run(async()=>{const {error}=await createClient().from('tenants').insert({name,slug});if(error)throw error;form.reset();setNotice('Empresa cadastrada. Crie um convite para o administrador dela.')})
 }
 async function addStaff(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault()
  const form=e.currentTarget, f=new FormData(form)
  const tenant=String(f.get('tenant_id')||currentTenant)
  const full_name=String(f.get('full_name')||'').trim()
  const username=String(f.get('username')||'').trim().toLowerCase()
  const contact_email=String(f.get('email')||'').trim().toLowerCase()
  const password=String(f.get('password')||'')
  if(!tenant||full_name.length<2){setError('Selecione a empresa e informe o nome.');return}
  if(Boolean(username)!==Boolean(password)){setError('Para criar login, informe nome de usuário e senha. Para funcionário sem login, deixe ambos vazios.');return}
  if(username&&(!/^[a-z][a-z0-9._-]{2,39}$/.test(username)||password.length<8||password.length>72)){setError('O usuário deve ter 3 a 40 caracteres, começar com letra e usar apenas letras minúsculas, números, ponto, traço ou underline. A senha deve ter 8 a 72 caracteres.');return}
  const employee_code=String(f.get('employee_code')||'').trim()||null
  const position=String(f.get('position')||'garcom')
  const employment_type=String(f.get('employment_type')||'fixo')
  const shift_start=String(f.get('shift_start')||'')||null
  const shift_end=String(f.get('shift_end')||'')||null
  await run(async()=>{
   const sb=createClient()
   if(!username){
    const {error}=await sb.from('staff').insert({tenant_id:tenant,full_name,contact_email:contact_email||null,employee_code,position,employment_type,shift_start,shift_end})
    if(error)throw error
    setNotice('Funcionário cadastrado sem acesso ao painel. É possível lançar ponto manualmente.')
   }else{
    const {data,error}=await sb.functions.invoke('register-staff',{body:{tenant_id:tenant,full_name,username,contact_email,employee_code,position,employment_type,shift_start,shift_end,password}})
    if(error)throw Error('Não foi possível criar acesso. '+(data?.error||error.message))
    if(!data?.success)throw Error(data?.error||'Conta não criada.')
    setNotice('Funcionário e login cadastrados no Supabase. Acesso imediato com nome de usuário e senha, sem confirmação por e-mail.')
   }
   form.reset()
  })
 }
 async function addOwner(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault()
  const f=new FormData(e.currentTarget)
  const tenant=String(f.get('tenant_id')||'')
  const name=String(f.get('full_name')||'').trim()
  const email=String(f.get('email')||'').trim().toLowerCase()
  const password=String(f.get('password')||'')
  if(!isAgr){setError('Apenas administradores AGR podem conceder acesso a proprietários.');return}
  if(!tenants.some(t=>t.id===tenant)){setError('Selecione uma empresa existente.');return}
  if(name.length<2||name.length>150){setError('Informe o nome completo do proprietário.');return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8||password.length>72){
   setError('Informe um e-mail válido e uma senha provisória entre 8 e 72 caracteres.');return
  }
  const form=e.currentTarget
  await run(async()=>{
   const {error:inviteError}=await createClient().from('account_invites').insert({
    tenant_id:tenant,email,full_name:name,role:'company_admin',invited_by:actorId
   })
   if(inviteError)throw inviteError
   form.reset()
   const {data:signup,error:signupError}=await createRegistrationClient().auth.signUp({
    email,password,options:{data:{full_name:name}}
   })
   if(signupError){
    setNotice('O convite do proprietário foi cadastrado, mas a criação da conta ainda não foi concluída: '+signupError.message+
     '. Ele poderá criar a própria senha pela página /ativar.')
    return
   }
   if(!signup.user?.identities?.length){
    setNotice('Convite do proprietário cadastrado. Este e-mail pode já possuir uma conta; nenhuma senha existente foi alterada. Oriente o dono a entrar com sua senha atual e ativar o convite.')
    return
   }
   setNotice('Proprietário convidado. Ele deverá confirmar o e-mail, entrar com a senha provisória e ativar a empresa pela página /ativar. Seu painel exibirá apenas esta empresa.')
  })
 }
 async function addEntry(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const f=new FormData(e.currentTarget)
  const tenant=String(f.get('tenant_id')||currentTenant)
  const staff_id=String(f.get('staff_id')||'')
  const kind=String(f.get('kind')||'entrada')
  const raw=String(f.get('occurred_at')||'')
  const note=String(f.get('note')||'').trim()
  const date=new Date(raw)
  if(!tenant||!staff_id||!raw||isNaN(date.getTime())||note.length<5){setError('Preencha empresa, funcionário, data, hora e justificativa com pelo menos 5 caracteres.');return}
  const person=staff.find(s=>s.id===staff_id)
  if(!person||person.tenant_id!==tenant){setError('Funcionário e empresa não correspondem.');return}
  const form=e.currentTarget
  await run(async()=>{const {error}=await createClient().from('time_entries').insert({tenant_id:tenant,staff_id,kind,occurred_at:date.toISOString(),note,created_by:actorId,source:'manual'})
   if(error)throw error;form.reset();setNotice('Marcação manual registrada com trilha de auditoria. O registro original não é alterado.')})
 }
 async function addInvite(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const f=new FormData(e.currentTarget)
  const tenant=String(f.get('tenant_id')||currentTenant),email=String(f.get('email')||'').trim().toLowerCase()
  const role=String(f.get('role')||'employee'),staff_id=String(f.get('staff_id')||'')
  if(!tenant||!email.includes('@')){setError('Selecione a empresa e informe um e-mail válido.');return}
  if(role==='employee'&&!staff_id){setError('Selecione o cadastro do funcionário para vincular a conta.');return}
  if(role==='employee'&&staff.find(s=>s.id===staff_id)?.tenant_id!==tenant){setError('O funcionário não pertence à empresa selecionada.');return}
  const form=e.currentTarget
  await run(async()=>{const {error}=await createClient().from('account_invites').insert({tenant_id:tenant,email,role,staff_id:role==='employee'?staff_id:null,invited_by:actorId})
   if(error)throw error;form.reset();setNotice('Convite preparado. Oriente o usuário a abrir /ativar, cadastrar o mesmo e-mail e confirmar o endereço. Nenhum e-mail foi enviado automaticamente.')})
 }
 async function toggleStaff(person:Staff){
  await run(async()=>{const {error}=await createClient().from('staff').update({active:!person.active}).eq('id',person.id)
   if(error)throw error;setNotice(person.active?'Funcionário desativado.':'Funcionário reativado.')})
 }
 function csv(){
  const header=['Empresa','Funcionário','Tipo','Data e hora (Brasília)','Origem','Observação']
  const rows=shownEntries.map(e=>[tenantName(e.tenant_id),staffName(e.staff_id),kindText[e.kind]||e.kind,fDate(e.occurred_at),e.source,e.note])
  const escape=(v:string)=>'"'+v.replace(/"/g,'""')+'"'
  const payload='\uFEFF'+[header,...rows].map(row=>row.map(escape).join(';')).join('\r\n')
  const url=URL.createObjectURL(new Blob([payload],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download='agr-ponto-historico.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
 }
 const navVisible=nav.filter(n=>isAgr || (n.key!=='empresas'&&n.key!=='clientes') ).filter(n=>canInvite || n.key!=='convites')
 const chart=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const day=d.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});return {day:d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),count:shownEntries.filter(e=>new Date(e.occurred_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})===day&&e.kind==='entrada').length}})
 const max=Math.max(1,...chart.map(c=>c.count))
 return <div className="app-shell">
  <aside className="sidebar"><div className="side-brand"><div className="brand-mark">AGR</div><div><strong>AGR Ponto</strong><small>Inteligente</small></div></div>
   <p className="side-label">{isAgr?'ADMINISTRAÇÃO AGR':'PAINEL DA EMPRESA'}</p>
   <nav aria-label="Menu do painel">{navVisible.map(n=><button key={n.key} className={'side-item '+(view===n.key?'active':'')} type="button" onClick={()=>{setView(n.key);setError('');setNotice('')}}><span>{n.icon}</span>{n.label}</button>)}</nav>
   <div className="side-bottom"><Link href="/quiosque" className="side-link">▤ Terminal da loja</Link><Logout/></div>
  </aside>
  <div className="app-content">
   <header className="topbar"><div><span className="eyebrow">{isAgr?'AGR Marketing e Tecnologia':'Gestão da empresa'}</span><div className="page-subtitle">{actorName}</div></div><span className="top-profile">{isAgr?'Administrador AGR':'Gestão de equipe'}</span></header>
   <div className="main-area">
   <div className="heading"><div><h1>{nav.find(n=>n.key===view)?.label||'Painel'}</h1><p>{isAgr?'Controle central de empresas e suas equipes':'Dados e registros exclusivos da sua empresa'}</p></div>
    <div className="heading-actions">{isAgr&&<select aria-label="Filtrar por empresa" value={selectedTenant} onChange={e=>{setSelectedTenant(e.target.value);if(e.target.value!=='all')setFormTenant(e.target.value)}}><option value="all">Todas as empresas</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}<button type="button" className="button subtle" onClick={()=>{setLoading(true);reload().catch(e=>setError(String(e))).finally(()=>setLoading(false))}}>Atualizar</button></div>
   </div>
   {error&&<div className="alert" role="alert">{error}</div>}
   {notice&&<div className="notice" role="status">{notice}</div>}
   {loading?<div className="panel">Carregando dados protegidos...</div>:<>
    {view==='inicio'&&<><div className="metrics"><div className="metric"><small>Empresas</small><strong>{shownTenants.length}</strong><span>Empresas na consulta</span></div><div className="metric"><small>Funcionários</small><strong>{shownStaff.filter(s=>s.active).length}</strong><span>Cadastros ativos</span></div><div className="metric"><small>Freelancers</small><strong>{shownStaff.filter(s=>s.employment_type==='freelancer').length}</strong><span>Profissionais cadastrados</span></div><div className="metric"><small>Marcações</small><strong>{shownEntries.length}</strong><span>Últimos 500 registros</span></div></div>
     <div className="overview-grid"><section className="panel"><h2>Entradas nos últimos 7 dias</h2><p>Quantidade de lançamentos por dia, não horas trabalhadas.</p><div className="bar-chart">{chart.map((c,i)=><div className="bar-group" key={i}><div className="bar-track"><div className="bar" style={{height:(c.count/max*100)+'%'}} title={String(c.count)+' entradas'}></div></div><strong>{c.count}</strong><span>{c.day}</span></div>)}</div></section>
     <section className="panel"><h2>Acesso rápido</h2><p>Ações frequentes de gestão da equipe.</p><div className="quick-grid"><button type="button" onClick={()=>setView('funcionarios')}>＋ Novo funcionário</button><button type="button" onClick={()=>setView('lancar')}>◷ Lançar ponto manual</button><button type="button" onClick={()=>setView('historico')}>☷ Ver histórico</button>{isAgr&&<button type="button" onClick={()=>setView('empresas')}>▣ Nova empresa</button>}</div></section></div>
     <section className="panel"><h2>Últimas marcações</h2><EntryTable rows={shownEntries.slice(0,8)} staffName={staffName} tenantName={tenantName} showTenant={isAgr}/></section>
    </>}
    {(view==='empresas'||view==='clientes')&&isAgr&&<><div className="content-grid"><section className="panel"><h2>{view==='clientes'?'Clientes cadastrados':'Empresas cadastradas'}</h2><p>Cada empresa tem dados isolados e seu próprio código de acesso.</p><div className="list-stack">{tenants.length?tenants.map(t=><button type="button" className="company-row" key={t.id} onClick={()=>{setSelectedTenant(t.id);setFormTenant(t.id);setView('funcionarios')}}><span className="company-icon">{t.name.slice(0,1).toUpperCase()}</span><span><strong>{t.name}</strong><small>{t.slug}</small></span><span className="pill">{t.status}</span></button>):<p>Nenhuma empresa cadastrada.</p>}</div></section>
    <section className="panel"><h2>Adicionar empresa</h2><p>Cadastre um novo cliente da AGR.</p><form className="form" onSubmit={addTenant}><label>Nome da empresa<input required name="name" minLength={2} placeholder="Ex.: Restaurante Central"/></label><label>Código da empresa<input required name="slug" minLength={3} maxLength={40} pattern="[a-z0-9][a-z0-9-]{2,39}" placeholder="restaurante-central"/></label><button disabled={busy}>{busy?'Salvando...':'Cadastrar empresa'}</button></form></section></div>
    {view==='empresas'&&<section className="panel" style={{marginTop:20}}><div className="panel-header"><div><h2>Administrador / proprietário da empresa</h2><p>Crie o acesso do dono ao painel exclusivo da própria empresa. Somente a AGR pode autorizar este perfil.</p></div><span className="pill">Acesso por empresa</span></div>
    <div className="content-grid"><div><form className="form" onSubmit={addOwner}>
     <TenantField isAgr={true} tenants={tenants} formTenant={formTenant} setFormTenant={setFormTenant}/>
     <label>Nome completo do proprietário<input required name="full_name" minLength={2} maxLength={150} autoComplete="name" placeholder="Ex.: Maria Oliveira"/></label>
     <label>Gmail ou e-mail de acesso<input required name="email" type="email" autoComplete="off" placeholder="proprietario@gmail.com"/></label>
     <label>Senha provisória<input required name="password" type="password" minLength={8} maxLength={72} autoComplete="new-password" placeholder="No mínimo 8 caracteres"/></label>
     <button type="submit" disabled={busy}>{busy?'Cadastrando...':'Criar acesso do proprietário'}</button>
    </form></div><div><div className="notice"><strong>Permissões:</strong> o proprietário poderá cadastrar funcionários e freelancers, lançar ponto manual, consultar relatórios e gerenciar acessos da sua empresa. Ele não visualizará outras empresas nem as opções gerais da AGR.</div>
    <p>O e-mail deve ser confirmado pelo dono. A senha provisória não ficará salva no cadastro e não deve ser compartilhada em grupos. O dono poderá alterá-la depois.</p>
    <h3>Acessos de proprietários</h3><div className="list-stack">{invites.filter(i=>i.role==='company_admin').map(i=><div className="company-row" key={i.id}><span><strong>{i.full_name||i.email}</strong><small>{i.email} · {tenantName(i.tenant_id)}</small></span><span className="pill">{i.accepted_at?'Ativo':'Pendente'}</span></div>)}{!invites.some(i=>i.role==='company_admin')&&<p>Nenhum proprietário convidado.</p>}</div>
    </div></div></section>}
    </>}
    {view==='funcionarios'&&<div className="content-grid"><section className="panel"><h2>Equipe cadastrada</h2><p>Funcionários fixos e freelancers, separados por empresa.</p><div className="table-wrap"><table><thead><tr><th>Funcionário</th>{isAgr&&<th>Empresa</th>}<th>Função</th><th>Vínculo</th><th>Status</th><th>Ação</th></tr></thead><tbody>{shownStaff.map(s=><tr key={s.id}><td><strong>{s.full_name}</strong><br/><small>{s.employee_code||'Sem matrícula'} · {s.username?'Usuário: '+s.username:'Sem login individual'}</small></td>{isAgr&&<td>{tenantName(s.tenant_id)}</td>}<td>{positionText[s.position]||s.position}</td><td>{s.employment_type==='freelancer'?'Freelancer':'Fixo'}</td><td><span className="pill">{s.active?'Ativo':'Inativo'}</span></td><td><button className="mini-button" type="button" disabled={busy} onClick={()=>toggleStaff(s)}>{s.active?'Desativar':'Reativar'}</button></td></tr>)}{!shownStaff.length&&<tr><td colSpan={isAgr?6:5}>Nenhum funcionário cadastrado.</td></tr>}</tbody></table></div></section>
     <section className="panel"><h2>Adicionar funcionário</h2><p>Cadastre garçons, cozinha, cumins e freelancers.</p><form className="form" onSubmit={addStaff}><TenantField isAgr={isAgr} tenants={tenants} formTenant={formTenant} setFormTenant={setFormTenant}/><label>Nome completo<input required name="full_name" minLength={2} placeholder="Nome do funcionário" autoComplete="name"/></label><label>Nome de usuário para login (opcional)<input name="username" minLength={3} maxLength={40} pattern="[a-z][a-z0-9._-]{2,39}" placeholder="Ex.: joao.silva" autoComplete="off"/></label><label>Gmail ou e-mail de contato (opcional; pode repetir)<input type="email" name="email" placeholder="contato@gmail.com" autoComplete="off"/></label><label>Senha individual (obrigatória para login)<input type="password" name="password" minLength={8} maxLength={72} placeholder="Mínimo de 8 caracteres" autoComplete="new-password"/></label><p>O e-mail é apenas contato: pode ser pessoal ou da empresa e pode se repetir. Cada acesso exige usuário único e senha pessoal, sem confirmação por e-mail. Para freelancers sem login, deixe usuário e senha vazios.</p><label>Matrícula (opcional)<input name="employee_code" placeholder="Ex.: 00042"/></label><div className="form-row"><label>Função<select name="position"><option value="garcom">Garçom</option><option value="cozinha">Cozinha</option><option value="cumim">Cumim</option><option value="outro">Outra</option></select></label><label>Vínculo<select name="employment_type"><option value="fixo">Fixo</option><option value="freelancer">Freelancer</option></select></label></div><div className="form-row"><label>Entrada prevista<input type="time" name="shift_start"/></label><label>Saída prevista<input type="time" name="shift_end"/></label></div><button disabled={busy}>{busy?'Salvando...':'Cadastrar funcionário'}</button></form></section></div>}
    {view==='lancar'&&<div className="content-grid"><section className="panel"><h2>Registrar ponto manual</h2><p>Permitido a qualquer momento para equipe fixa ou freelance. Todas as marcações são auditadas.</p><form className="form" onSubmit={addEntry}>
     <TenantField isAgr={isAgr} tenants={tenants} formTenant={formTenant} setFormTenant={setFormTenant}/>
     <label>Funcionário<select required name="staff_id" defaultValue="" key={currentTenant}><option value="">Selecione o funcionário</option>{employeesForForm.map(s=><option key={s.id} value={s.id}>{s.full_name} — {positionText[s.position]||s.position}{s.employment_type==='freelancer'?' (freelancer)':''}</option>)}</select></label>
     <div className="form-row"><label>Tipo<select name="kind"><option value="entrada">Entrada</option><option value="intervalo_inicio">Início do intervalo</option><option value="intervalo_fim">Fim do intervalo</option><option value="saida">Saída</option></select></label><label>Data e horário<input required key={view} name="occurred_at" type="datetime-local" defaultValue={localNow()}/></label></div>
     <label>Motivo do lançamento<textarea name="note" required minLength={5} maxLength={500} rows={3} placeholder="Ex.: Registro informado pelo supervisor no início da jornada"/></label>
     <button disabled={busy}>{busy?'Salvando...':'Salvar marcação manual'}</button></form></section>
     <section className="panel"><h2>Como funciona</h2><div className="steps"><div><b>1</b><p>Selecione o funcionário de uma empresa.</p></div><div><b>2</b><p>Informe entrada, início e fim do intervalo, ou saída, com os horários corretos.</p></div><div><b>3</b><p>Registre uma justificativa. O sistema conserva autor e data de criação.</p></div></div><div className="notice">Lançamentos manuais não alteram nem apagam registros existentes. Não representam validação biométrica.</div></section></div>}
    {view==='historico'&&<section className="panel"><div className="panel-header"><div><h2>Histórico de marcações</h2><p>Até 500 registros recentes. Exporte o filtro atual para CSV, apenas como relatório de consulta.</p></div><button type="button" className="button" onClick={csv} disabled={!shownEntries.length}>Exportar CSV</button></div><EntryTable rows={shownEntries} staffName={staffName} tenantName={tenantName} showTenant={isAgr}/></section>}
    {view==='convites'&&canInvite&&<div className="content-grid"><section className="panel"><h2>Convites de acesso</h2><p>Somente o e-mail confirmado pelo convidado pode ativar o vínculo.</p><div className="table-wrap"><table><thead><tr><th>E-mail</th><th>Papel</th><th>Estado</th></tr></thead><tbody>{invites.map(i=><tr key={i.id}><td>{i.full_name&&<strong>{i.full_name}<br/></strong>}{i.email}<br/><small>{tenantName(i.tenant_id)}</small></td><td>{i.role}</td><td>{i.accepted_at?'Ativado':'Pendente'}</td></tr>)}{!invites.length&&<tr><td colSpan={3}>Sem convites cadastrados.</td></tr>}</tbody></table></div></section>
    <section className="panel"><h2>Criar convite</h2><form className="form" onSubmit={addInvite}><TenantField isAgr={isAgr} tenants={tenants} formTenant={formTenant} setFormTenant={setFormTenant}/><label>E-mail<input required type="email" name="email" placeholder="usuario@empresa.com"/></label><label>Permissão<select name="role" onChange={()=>{}}><option value="employee">Funcionário</option><option value="hr">RH</option>{isAgr&&<option value="company_admin">Administrador da empresa</option>}</select></label><label>Vincular funcionário (obrigatório para permissão Funcionário)<select name="staff_id" defaultValue="" key={currentTenant}><option value="">Selecione</option>{employeesForForm.map(s=><option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label><button disabled={busy}>{busy?'Criando...':'Preparar convite'}</button></form><div className="notice">Compartilhe com o convidado o endereço do sistema seguido de <strong>/ativar</strong>. O envio de e-mail automático ainda não está configurado.</div></section></div>}
    {view==='configuracoes'&&<div className="content-grid"><section className="panel"><h2>Segurança e acesso</h2><p>Contas protegidas pelo Supabase. Dados de empresas separados por políticas de acesso no banco.</p><div className="settings-list"><div><strong>Recuperação de senha</strong><Link href="/forgot-password">Abrir</Link></div><div><strong>Teste de câmera</strong><Link href="/quiosque">Abrir terminal</Link></div><div><strong>Contas vinculadas</strong><button type="button" onClick={()=>setView('convites')} disabled={!canInvite}>Convites</button></div></div></section><section className="panel"><h2>Integrações em preparação</h2><p>Reconhecimento facial com validação de identidade, autorização dos aparelhos da loja e monitoramento por câmeras precisam de integração e homologação específicas. Não estão ativos nesta versão.</p><div className="alert">Não utilize este ambiente como registrador eletrônico de ponto oficial antes da revisão legal e da validação dos requisitos trabalhistas e da LGPD.</div></section></div>}
   </>}
   </div>
  </div>
 </div>
}
function TenantField({isAgr,tenants,formTenant,setFormTenant}:{isAgr:boolean;tenants:Tenant[];formTenant:string;setFormTenant:(v:string)=>void}){
 return isAgr?<label>Empresa<select required name="tenant_id" value={formTenant} onChange={e=>setFormTenant(e.target.value)}><option value="">Selecione a empresa</option>{tenants.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label>:null
}
function EntryTable({rows,staffName,tenantName,showTenant}:{rows:Entry[];staffName:(id:string)=>string;tenantName:(id:string)=>string;showTenant:boolean}){
 return <div className="table-wrap"><table><thead><tr><th>Funcionário</th>{showTenant&&<th>Empresa</th>}<th>Marcação</th><th>Data e hora</th><th>Origem</th><th>Observação</th></tr></thead><tbody>{rows.map(e=><tr key={e.id}><td><strong>{staffName(e.staff_id)}</strong></td>{showTenant&&<td>{tenantName(e.tenant_id)}</td>}<td>{kindText[e.kind]||e.kind}</td><td>{fDate(e.occurred_at)}</td><td><span className="pill">{e.source==='manual'?'Manual':'Terminal'}</span></td><td className="note-cell">{e.note||'—'}</td></tr>)}{rows.length===0&&<tr><td colSpan={showTenant?6:5}>Nenhuma marcação encontrada.</td></tr>}</tbody></table></div>
}
