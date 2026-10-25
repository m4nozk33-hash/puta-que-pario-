
import Link from 'next/link'
import {requireRole} from '../../lib/session'
import CameraPreview from '../../components/CameraPreview'
export const dynamic='force-dynamic'
export default async function Quiosque(){
 await requireRole(['agr_admin','company_admin','hr'])
 return <div className="kiosk-page"><div className="kiosk-wrap"><p className="eyebrow">AGR Ponto Inteligente</p><h1>Terminal de ponto</h1><p>Câmera do celular ou tablet da loja</p><CameraPreview/><div className="alert">A marcação facial está bloqueada até a integração de identificação biométrica e a autorização segura dos dispositivos. O teste de câmera abaixo não registra nem envia fotos.</div><Link href="/inicio" className="button subtle">Voltar ao painel</Link></div></div>
}
