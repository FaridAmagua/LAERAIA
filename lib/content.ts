import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import type { BlogPostDetail, BlogPostSummary, Locale } from './types'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

type BlogFrontmatter = {
  title?: string
  excerpt?: string
  createdAt?: string
}

async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified().use(remarkParse).use(remarkRehype).use(rehypeStringify).process(markdown)
  return String(file)
}

function contentDir(section: 'blog', locale: Locale): string {
  return path.join(CONTENT_ROOT, section, locale)
}

function listMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir).filter((name) => name.endsWith('.mdx'))
}

export async function getAllBlogPosts(locale: Locale): Promise<BlogPostSummary[]> {
  const dir = contentDir('blog', locale)

  return listMdxFiles(dir)
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, '')
      const raw = fs.readFileSync(path.join(dir, filename), 'utf8')
      const { data } = matter(raw)
      const fm = data as BlogFrontmatter

      return {
        slug,
        title: fm.title ?? slug,
        excerpt: fm.excerpt ?? '',
        createdAt: fm.createdAt ?? '2025-01-01',
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getBlogBySlug(locale: Locale, slug: string): Promise<BlogPostDetail | null> {
  const filePath = path.join(contentDir('blog', locale), `${slug}.mdx`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  const fm = data as BlogFrontmatter

  return {
    slug,
    title: fm.title ?? slug,
    excerpt: fm.excerpt ?? '',
    createdAt: fm.createdAt ?? '2025-01-01',
    bodyHtml: await markdownToHtml(content),
  }
}
