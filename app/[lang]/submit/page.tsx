import PromptForm from '@/components/PromptForm'
import { assertLocale } from '@/lib/i18n'

type SubmitPageProps = {
  params: Promise<{ lang: string }>
}

export default async function SubmitPage({ params }: SubmitPageProps) {
  const { lang } = await params
  const locale = assertLocale(lang)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{locale === 'es' ? 'Enviar prompt' : 'Submit a prompt'}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {locale === 'es'
            ? 'Las propuestas de comunidad requieren imagen local subida. Quedan pending hasta aprobacion admin.'
            : 'Community submissions require local image upload. They stay pending until admin approval.'}
        </p>
      </div>

      <PromptForm locale={locale} />
    </div>
  )
}
