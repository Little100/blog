import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Ctx = {
  focusAvailable: boolean
  openArticleFocus: () => void
  setArticleFocusOpener: (open: (() => void) | null) => void
}

const ArticleFocusContext = createContext<Ctx | null>(null)

export function ArticleFocusProvider({ children }: { children: ReactNode }) {
  const [opener, setOpener] = useState<(() => void) | null>(null)

  const setArticleFocusOpener = useCallback((fn: (() => void) | null) => {
    setOpener(() => fn)
  }, [])

  const openArticleFocus = useCallback(() => {
    opener?.()
  }, [opener])

  const value = useMemo(
    () => ({
      focusAvailable: opener != null,
      openArticleFocus,
      setArticleFocusOpener,
    }),
    [openArticleFocus, opener, setArticleFocusOpener],
  )

  return <ArticleFocusContext.Provider value={value}>{children}</ArticleFocusContext.Provider>
}

export function useArticleFocus() {
  const ctx = useContext(ArticleFocusContext)
  if (!ctx) {
    throw new Error('useArticleFocus must be used within ArticleFocusProvider')
  }
  return ctx
}
