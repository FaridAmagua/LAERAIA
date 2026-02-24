import PromptsListClient from '@/components/PromptsListClient'
import PromptTypeTabs from '@/components/PromptTypeTabs'
import { assertLocale } from '@/lib/i18n'
import { listPrompts } from '@/lib/promptData'

type PromptsPageProps = {
  params: Promise<{ lang: string }>
}

export default async function PromptsPage({ params }: PromptsPageProps) {
  const { lang } = await params
  const locale = assertLocale(lang)
  const { items } = await listPrompts({ locale, page: 1, pageSize: 120 })

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-heading text-3xl font-semibold">{locale === 'es' ? 'Biblioteca de prompts' : 'Prompt library'}</h1>
        <p className="text-sm text-slate-300">
          {locale === 'es'
            ? 'Filtra por categoria, estilo y mood. Usa las secciones por tipo para video, imagen y SEO.'
            : 'Filter by category, style, and mood. Use type sections for video, image, and SEO prompts.'}
        </p>
        <PromptTypeTabs locale={locale} active="all" />
      </div>

      <PromptsListClient locale={locale} initialPrompts={items} />
    </div>
  )
}
