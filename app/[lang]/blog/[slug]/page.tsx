import { getBlogBySlug } from '@/lib/content'
import { assertLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'

type BlogDetailProps = {
  params: Promise<{ lang: string; slug: string }>
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { lang, slug } = await params
  const locale = assertLocale(lang)
  const post = await getBlogBySlug(locale, slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <h1 className="font-heading text-3xl font-semibold">{post.title}</h1>
      <p className="mt-2 text-sm text-slate-400">{post.createdAt}</p>
      <div className="prose prose-invert mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
    </article>
  )
}
