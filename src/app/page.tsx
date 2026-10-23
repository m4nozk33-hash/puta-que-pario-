import Link from 'next/link'
export default function Home() {
 return <main><section className="card"><div className="brand">AGR MARKETING E TECNOLOGIA</div><h1>AGR Ponto Inteligente</h1><span className="tag">Primeira etapa de implantação</span><p>Gestão de ponto eletrônico para empresas.</p><Link className="button" href="/login">Acessar painel administrativo</Link><div className="notice">O acesso administrativo está em desenvolvimento. Marcações de ponto e reconhecimento facial ainda não estão disponíveis.</div></section></main>
}
