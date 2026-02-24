import '@/styles/globals.css'
import { Sora, Plus_Jakarta_Sans } from 'next/font/google'
import type { Metadata } from 'next'

const headingFont = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
})

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'laera.ia',
  description: 'laera.ia: tested prompts with notes, variations, and community submissions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${headingFont.variable} ${bodyFont.variable} min-h-screen bg-black text-slate-100 antialiased`}>
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,#000000_0%,#020202_100%)]" />
        {children}
      </body>
    </html>
  )
}
