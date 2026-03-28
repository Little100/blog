import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { getRoutePathname } from '../../utils/useLocalePath'

type RightRailContextValue = {
  /** Whether the sidebar is expanded (defaults to true globally; only collapsible on article pages) */
  expanded: boolean
  setExpanded: (value: boolean) => void
  toggle: () => void
  /** Only article reading pages support collapsing the right category sidebar; home page and others are always expanded with no toggle button */
  isPostPage: boolean
  isHomePage: boolean
  isBlogPage: boolean
}

const RightRailContext = createContext<RightRailContextValue | null>(null)

export function RightRailProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const route = getRoutePathname(pathname)
  const isPostPage = route.startsWith('/post/')
  const isHomePage = route === '/'
  const isBlogPage = route === '/blog'
  const [userOverride, setUserOverride] = useState<boolean | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: reset user override on navigation
    setUserOverride(null)
  }, [pathname])

  const expanded = userOverride !== null ? userOverride : true

  const setExpanded = useCallback(
    (value: boolean) => {
      if (!isPostPage) return
      setUserOverride(value)
    },
    [isPostPage],
  )

  const toggle = useCallback(() => {
    if (!isPostPage) return
    setUserOverride((prev) => {
      const current = prev !== null ? prev : true
      return !current
    })
  }, [isPostPage])

  const value = useMemo(
    () => ({
      expanded,
      setExpanded,
      toggle,
      isPostPage,
      isHomePage,
      isBlogPage,
    }),
    [expanded, setExpanded, toggle, isPostPage, isHomePage, isBlogPage],
  )

  return <RightRailContext.Provider value={value}>{children}</RightRailContext.Provider>
}

export function useRightRail() {
  const ctx = useContext(RightRailContext)
  if (!ctx) {
    throw new Error('useRightRail must be used within RightRailProvider')
  }
  return ctx
}
