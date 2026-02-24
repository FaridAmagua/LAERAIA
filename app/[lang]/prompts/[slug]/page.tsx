import CopyButton from '@/components/CopyButton'
import ExpandableText from '@/components/ExpandableText'
import Tag from '@/components/Tag'
import VoteButton from '@/components/VoteButton'
import { assertLocale } from '@/lib/i18n'
import { isEmbeddableIframe, toEmbeddableVideoUrl } from '@/lib/media'
import { findPromptBySlug } from '@/lib/promptData'
import { typeLabel } from '@/lib/promptTypes'
import { redirect } from 'next/navigation'

type PromptDetailProps = {
  params: Promise<{ lang: string; slug: string }>
}

function compactText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n')
    .trim()
}

function SettingsList({ entries }: { entries: Array<{ key: string; value: string }> }) {
  return (
    <dl className="mt-4 space-y-2 text-sm text-slate-300">
      {entries.map((entry) => (
        <div key={entry.key} className="flex justify-between gap-3 border-b border-white/10 pb-2">
          <dt>{entry.key}</dt>
          <dd>{entry.value || 'N/A'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default async function PromptDetailPage({ params }: PromptDetailProps) {
  const { lang, slug } = await params
  const locale = assertLocale(lang)
  const prompt = await findPromptBySlug(locale, slug)

  if (!prompt) {
    redirect(`/${locale}`)
  }

  const youtubeEmbed = prompt.youtubeUrl ? toEmbeddableVideoUrl(prompt.youtubeUrl) : ''
  const detailImage = prompt.previewImageDetailUrl || prompt.previewImageMasterUrl || prompt.previewImageCardUrl || prompt.previewImageUrl
  const isStoryLike = prompt.type === 'video'

  return (
    <article className="space-y-6">
      <section className="grid gap-6 rounded-2xl border border-cyan-400/20 bg-slate-900/75 p-6 lg:grid-cols-[minmax(300px,420px)_1fr]">
        <div className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950/70 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]">
          {prompt.youtubeUrl ? (
            <div className={`${isStoryLike ? 'h-[72vh] min-h-[460px] max-h-[900px]' : 'h-[68vh] min-h-[380px] max-h-[820px]'} w-full`}>
              {isEmbeddableIframe(youtubeEmbed) ? (
                <iframe
                  src={youtubeEmbed}
                  title={prompt.title}
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <a href={prompt.youtubeUrl} target="_blank" rel="noreferrer" className="flex h-full items-center justify-center text-cyan-300">
                  Open YouTube preview
                </a>
              )}
            </div>
          ) : (
            <div className="w-full">
              <img src={detailImage} alt={prompt.title} className="max-h-[820px] w-full object-contain" loading="lazy" />
            </div>
          )}
        </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-heading text-3xl font-semibold">{prompt.title}</h1>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-100">{locale === 'es' ? 'Descripcion' : 'Description'}</h2>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <ExpandableText
                text={compactText(prompt.description || '')}
                maxChars={220}
                locale={locale}
                className="whitespace-pre-wrap text-sm text-slate-300"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-100">Prompt</h2>
            <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-snug text-slate-200">
              {compactText(prompt.promptText)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag>{typeLabel(prompt.type, locale)}</Tag>
            <Tag>{prompt.category}</Tag>
            <Tag>{prompt.style}</Tag>
            <Tag>{prompt.mood}</Tag>
            <Tag>{prompt.duration}</Tag>
            {prompt.tool && <Tag>{prompt.tool}</Tag>}
            {prompt.source === 'community' && <Tag>community</Tag>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              text={prompt.promptText}
              copiedLabel={locale === 'es' ? 'Copiado' : 'Copied'}
              idleLabel={locale === 'es' ? 'Copiar prompt' : 'Copy prompt'}
            />
            <VoteButton promptId={prompt.id} initialVotes={prompt.voteCount} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-heading text-xl font-semibold">{locale === 'es' ? 'Configuracion' : 'Settings'}</h2>
          <SettingsList
            entries={[
              { key: locale === 'es' ? 'Duracion' : 'Duration', value: prompt.duration },
              { key: locale === 'es' ? 'Estilo' : 'Style', value: prompt.style },
              { key: 'Mood', value: prompt.mood },
              { key: locale === 'es' ? 'Categoria' : 'Category', value: prompt.category },
              { key: locale === 'es' ? 'Tool/modelo' : 'Tool/model', value: prompt.tool ?? '' },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-heading text-xl font-semibold">{locale === 'es' ? 'Resultado' : 'Result'}</h2>
          <p className="mt-3 text-sm text-slate-300">
            {locale === 'es' ? 'Video o referencia visual del resultado probado.' : 'Video or visual reference of the tested output.'}
          </p>
          {prompt.resultUrl ? (
            <a href={prompt.resultUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              {locale === 'es' ? 'Abrir resultado' : 'Open result'}
            </a>
          ) : (
            <p className="mt-4 text-sm text-slate-400">{locale === 'es' ? 'Sin enlace disponible.' : 'No result link available.'}</p>
          )}
        </div>
      </section>

      {prompt.settingsJson && (
        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-heading text-xl font-semibold">JSON</h2>
          <pre className="mt-4 overflow-auto rounded-lg border border-white/10 bg-slate-950/50 p-4 text-xs text-slate-300">
            {JSON.stringify(prompt.settingsJson, null, 2)}
          </pre>
        </section>
      )}
    </article>
  )
}
