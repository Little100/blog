export function searchInArticleDom(
  root: HTMLElement | null,
  needle: string,
  options?: { flashClass?: string; flashMs?: number },
): { found: number; firstBlock: Element | null } {
  const raw = needle.trim()
  if (!root || !raw) return { found: 0, firstBlock: null }

  const lower = raw.toLowerCase()
  let found = 0
  let firstBlock: Element | null = null

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement
      if (!p) return NodeFilter.FILTER_REJECT
      if (p.closest('script, style, textarea, .giscus-wrapper')) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let n: Node | null
  while ((n = walker.nextNode())) {
    const tn = n as Text
    const text = tn.textContent ?? ''
    let start = 0
    while (start < text.length) {
      const slice = text.slice(start)
      const idx = slice.toLowerCase().indexOf(lower)
      if (idx < 0) break
      found += 1
      if (!firstBlock) {
        firstBlock = blockAncestor(tn, root)
      }
      start += idx + raw.length
    }
  }

  const flashClass = options?.flashClass ?? 'post-in-article-search-flash'
  const flashMs = options?.flashMs ?? 2200

  if (firstBlock) {
    firstBlock.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (flashClass) {
      firstBlock.classList.add(flashClass)
      window.setTimeout(() => firstBlock?.classList.remove(flashClass), flashMs)
    }
  }

  return { found, firstBlock }
}

function blockAncestor(start: Text, root: HTMLElement): Element {
  const blocks = new Set([
    'P',
    'LI',
    'BLOCKQUOTE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'TD',
    'TH',
    'DIV',
    'SECTION',
    'ARTICLE',
  ])
  let el: Element | null = start.parentElement
  while (el && el !== root) {
    if (blocks.has(el.tagName)) return el
    el = el.parentElement
  }
  return start.parentElement ?? root
}
