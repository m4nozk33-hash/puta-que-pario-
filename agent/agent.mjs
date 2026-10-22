// Agente local AGR: roda no PC/mini-servidor da empresa, na mesma rede da câmera IP.
// Requer Node 18+ e ffmpeg. Variáveis: SERVER_URL, CAMERA_KEY, RTSP_URL
import { spawn } from 'node:child_process'
const { SERVER_URL, CAMERA_KEY, RTSP_URL } = process.env
if (!SERVER_URL || !CAMERA_KEY || !RTSP_URL) { console.error('Defina SERVER_URL, CAMERA_KEY e RTSP_URL'); process.exit(1) }
const H = { 'x-camera-key': CAMERA_KEY }

const snap = () => new Promise((ok, fail) => {
  const p = spawn('ffmpeg', ['-rtsp_transport', 'tcp', '-i', RTSP_URL, '-frames:v', '1', '-f', 'image2', '-q:v', '2', 'pipe:1'], { stdio: ['ignore', 'pipe', 'ignore'] })
  const b = []; p.stdout.on('data', d => b.push(d))
  p.on('close', c => (c === 0 && b.length ? ok(Buffer.concat(b)) : fail(new Error('ffmpeg não obteve imagem da câmera'))))
})

for (;;) {
  try {
    const r = await fetch(`${SERVER_URL}/api/agent/poll`, { headers: H })
    if (r.status === 401) console.error('Chave da câmera recusada')
    if (r.status === 200) {
      const { id } = await r.json()
      const f = await fetch(`${SERVER_URL}/api/agent/frame?challenge=${id}`, { method: 'POST', headers: { ...H, 'content-type': 'image/jpeg' }, body: await snap() })
      console.log(new Date().toISOString(), 'quadro enviado', id, f.status)
    }
  } catch (e) { console.error(e.message) }
  await new Promise(r => setTimeout(r, 1500))
}
