import Link from 'next/link'
import PromptsListClient from '@/components/PromptsListClient'
import PromptTypeTabs from '@/components/PromptTypeTabs'
import TrendingPromptsClient from '@/components/TrendingPromptsClient'
import { assertLocale, withLocalePath } from '@/lib/i18n'
import { listPrompts, listTrendingPrompts } from '@/lib/promptData'

type LangHomeProps = {
  params: Promise<{ lang: string }>
}

export default async function LangHomePage({ params }: LangHomeProps) {
  const { lang } = await params
  const locale = assertLocale(lang)
  const trending = await listTrendingPrompts(locale)
  const { items } = await listPrompts({ locale, page: 1, pageSize: 120 })

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-black px-5 py-8 shadow-[0_20px_60px_rgba(3,7,18,0.45)] md:px-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">laera.ia</p>
        <h1 className="mt-3 max-w-4xl font-heading text-2xl font-semibold leading-tight md:text-3xl">
          {locale === 'es' ? 'Donde las ideas se transforman en resultados con AI' : 'Where ideas turn into results with AI'}
        </h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          {locale === 'es'
            ? 'Comparte, descubre y escala tu creatividad con la comunidad más activa de AI.'
            : 'Share, discover, and scale your creativity with the most active AI community.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={withLocalePath(locale, '/prompts')} className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            {locale === 'es' ? 'Explorar prompts' : 'Explore prompts'}
          </Link>
          <Link href={withLocalePath(locale, '/trending')} className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100 transition hover:bg-white/10">
            {locale === 'es' ? 'Ver trending' : 'See trending'}
          </Link>
          <Link href={withLocalePath(locale, '/submit')} className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100 transition hover:bg-white/10">
            {locale === 'es' ? 'Enviar prompt' : 'Submit a prompt'}
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold">Trending</h2>
          <Link href={withLocalePath(locale, '/trending')} className="text-sm text-cyan-300 hover:text-cyan-200">
            {locale === 'es' ? 'Ranking completo' : 'Full ranking'}
          </Link>
        </div>
        <TrendingPromptsClient locale={locale} prompts={trending} showDescription={false} />
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-heading text-3xl font-semibold">{locale === 'es' ? 'Biblioteca de prompts' : 'Prompt library'}</h2>
          <p className="text-sm text-slate-300">
            {locale === 'es'
              ? 'Filtra por categoria, estilo y mood. Usa las secciones por tipo para video, imagen y SEO.'
              : 'Filter by category, style, and mood. Use type sections for video, image, and SEO prompts.'}
          </p>
          <PromptTypeTabs locale={locale} active="all" />
        </div>

        <PromptsListClient locale={locale} initialPrompts={items} />
      </section>
    </div>
  )
}
