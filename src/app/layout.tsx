import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AGR Ponto Inteligente',
  description: 'Plataforma de gestão de ponto eletrônico da AGR Marketing e Tecnologia'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
