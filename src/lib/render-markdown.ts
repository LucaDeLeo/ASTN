import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

function normalizeMarkdownInput(text: unknown): string {
  if (typeof text === 'string') return text
  if (text == null) return ''
  if (typeof text === 'object') return JSON.stringify(text)
  return String(text)
}

function sanitizeServerHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
}

export function renderMarkdown(text: unknown): string {
  const raw = marked.parse(normalizeMarkdownInput(text), { async: false })

  if (typeof window === 'undefined') {
    return sanitizeServerHtml(raw)
  }

  return DOMPurify.sanitize(raw)
}

export const renderMarkdownToHtml = renderMarkdown
