import TrendingPromptsClient from '@/components/TrendingPromptsClient'
import { assertLocale } from '@/lib/i18n'
import { listTrendingPrompts } from '@/lib/promptData'

export default async function TrendingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale = assertLocale(lang)
  const items = await listTrendingPrompts(locale)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Trending</h1>
        <p className="mt-2 text-sm text-slate-300">
          {locale === 'es'
            ? 'Ranking global basado en votos de base de datos + recencia de los ultimos 7 dias.'
            : 'Global ranking based on database votes + 7-day recency boost.'}
        </p>
      </div>
      <TrendingPromptsClient locale={locale} prompts={items} maxItems={50} />
    </div>
  )
}
