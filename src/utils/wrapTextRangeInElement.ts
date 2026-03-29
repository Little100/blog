/**
 * Wraps the text range [start, end) in `root` (tree order) with `wrapper`.
 * Used after Shiki injects HTML so diagnostics align with raw source offsets.
 */
export function wrapTextRangeInElement(
  root: HTMLElement,
  start: number,
  end: number,
  wrapper: HTMLElement,
): boolean {
  if (start < 0 || end <= start) return false

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let pos = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  let n: Node | null
  while ((n = walker.nextNode())) {
    const tn = n as Text
    const len = tn.length
    const nextPos = pos + len
    if (nextPos > start && startNode === null) {
      startNode = tn
      startOffset = Math.max(0, start - pos)
    }
    if (nextPos >= end) {
      endNode = tn
      endOffset = Math.max(0, end - pos)
      break
    }
    pos = nextPos
  }

  if (!startNode || !endNode) return false

  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)

  try {
    range.surroundContents(wrapper)
    return true
  } catch {
    const frag = range.extractContents()
    wrapper.appendChild(frag)
    range.insertNode(wrapper)
    return true
  }
}
