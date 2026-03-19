import type { ReactNode } from 'react'

/**
 * Simple markdown renderer for chat messages.
 * Handles **bold**, *italic*, and [link](url) formatting.
 */
export function renderMarkdown(text: string): ReactNode {
  if (typeof text !== 'string') {
    const val = (text as unknown) ?? ''
    return typeof val === 'object'
      ? JSON.stringify(val)
      : String(val as string | number)
  }

  // Split on bold, italic, and markdown links
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    // Markdown link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, linkText, url] = linkMatch
      const isInternal = url.startsWith('/')
      return (
        <a
          key={i}
          href={url}
          className="underline text-primary hover:text-primary/80"
          {...(isInternal
            ? {}
            : { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {linkText}
        </a>
      )
    }
    return part
  })
}
