import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { assertLocale, withLocalePath } from '@/lib/i18n'

type LangLayoutProps = {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params
  const locale = assertLocale(lang)

  return (
    <div className="flex min-h-screen w-full flex-col pb-8 pt-24">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
          <Link href={withLocalePath(locale)} className="font-heading text-lg font-semibold tracking-tight text-white">
            Promptify
          </Link>

          <nav className="hidden items-center gap-1 text-sm text-slate-300 md:flex">
            <Link href={withLocalePath(locale)} className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              {locale === 'es' ? 'Inicio' : 'Home'}
            </Link>
            <Link href={withLocalePath(locale, '/prompts')} className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Prompts
            </Link>
            <Link href={withLocalePath(locale, '/trending')} className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Trending
            </Link>
            <Link href={withLocalePath(locale, '/submit')} className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              {locale === 'es' ? 'Enviar' : 'Submit'}
            </Link>
            <Link href={withLocalePath(locale, '/blog')} className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Blog
            </Link>
          </nav>

          <LanguageSwitcher locale={locale} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 md:px-6">{children}</main>

      <footer className="mx-auto mt-12 w-full max-w-[1600px] border-t border-white/10 px-4 pt-6 text-xs text-slate-400 md:px-8">
        © {new Date().getFullYear()} Promptify
      </footer>
    </div>
  )
}
