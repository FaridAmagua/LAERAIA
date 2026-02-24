import Link from 'next/link'
import { getAllBlogPosts } from '@/lib/content'
import { assertLocale, withLocalePath } from '@/lib/i18n'

type BlogListProps = {
  params: Promise<{ lang: string }>
}

export default async function BlogListPage({ params }: BlogListProps) {
  const { lang } = await params
  const locale = assertLocale(lang)
  const posts = await getAllBlogPosts(locale)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Blog</h1>
        <p className="mt-2 text-sm text-slate-300">
          {locale === 'es' ? 'Notas rápidas para mejorar prompts y documentar resultados.' : 'Quick notes to improve prompts and document results.'}
        </p>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.slug} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="font-heading text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{post.excerpt}</p>
            <Link href={withLocalePath(locale, `/blog/${post.slug}`)} className="mt-4 inline-block text-sm text-cyan-300 hover:text-cyan-200">
              {locale === 'es' ? 'Leer post' : 'Read post'}
            </Link>
          </article>
        ))}
      </div>

      {posts.length === 0 && <p className="text-sm text-slate-400">{locale === 'es' ? 'Aún no hay posts en este idioma.' : 'No posts yet in this language.'}</p>}
    </div>
  )
}
