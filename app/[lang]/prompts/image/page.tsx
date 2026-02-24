import PromptsListClient from '@/components/PromptsListClient'
import PromptTypeTabs from '@/components/PromptTypeTabs'
import { assertLocale } from '@/lib/i18n'
import { listPrompts } from '@/lib/promptData'

export default async function ImagePromptsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale = assertLocale(lang)
  const { items } = await listPrompts({ locale, type: 'image', page: 1, pageSize: 120 })

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-heading text-3xl font-semibold">{locale === 'es' ? 'Prompts de imagen' : 'Image prompts'}</h1>
        <PromptTypeTabs locale={locale} active="image" />
      </div>
      <PromptsListClient locale={locale} initialPrompts={items} forcedType="image" />
    </div>
  )
}
