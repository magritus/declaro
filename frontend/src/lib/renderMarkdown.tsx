import React from 'react'

function boldify(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-surface-overlay rounded text-xs font-mono">$1</code>')
}

export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  const flushList = () => {
    if (listItems.length === 0) return
    result.push(
      <ul key={key++} className="space-y-1.5 my-2">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-secondary">
            <span className="text-accent mt-0.5 flex-shrink-0">▸</span>
            <span dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      continue
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      result.push(
        <h4 key={key++} className="text-xs font-bold uppercase tracking-widest text-muted mt-4 mb-1.5">
          {trimmed.slice(4)}
        </h4>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      result.push(
        <h3 key={key++} className="text-sm font-semibold text-primary mt-4 mb-1 border-b border-border-subtle pb-1">
          {trimmed.slice(3)}
        </h3>
      )
    } else if (trimmed.match(/^[-•*] /)) {
      listItems.push(trimmed.slice(2))
    } else {
      flushList()
      result.push(
        <p key={key++} className="text-sm text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />
      )
    }
  }
  flushList()
  return <>{result}</>
}
