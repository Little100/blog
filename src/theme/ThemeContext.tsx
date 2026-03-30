import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

type ColorPreference = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  theme: 'light' | 'dark'
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const PREF_KEY = 'BLOG-theme-preference'
const LEGACY_KEY = 'BLOG-theme'

function readPreference(): ColorPreference {
  if (typeof window === 'undefined') {
    return 'system'
  }
  try {
    const stored = window.localStorage.getItem(PREF_KEY)
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY)
    if (legacy === 'light' || legacy === 'dark') {
      return legacy
    }
    if (legacy === 'focus') {
      return 'system'
    }
  } catch {
    // localStorage may be unavailable in private browsing or strict sandbox mode
  }
  return 'system'
}

function subscribeSystemDark(callback: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getSystemDarkSnapshot() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getSystemDarkServerSnapshot() {
  return false
}

function resolveTheme(pref: ColorPreference, systemIsDark: boolean): 'light' | 'dark' {
  if (pref === 'system') {
    if (systemIsDark) {
      return 'dark'
    }
    return 'light'
  }
  if (pref === 'dark') {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ColorPreference>(readPreference)
  const systemIsDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot,
  )

  const theme = useMemo(
    () => resolveTheme(preference, systemIsDark),
    [preference, systemIsDark],
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(PREF_KEY, preference)
  }, [theme, preference])

  const cycleTheme = useCallback(() => {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setPreference((prev) => {
      const effective = resolveTheme(prev, sysDark)
      if (effective === 'light') {
        return 'dark'
      }
      return 'light'
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      cycleTheme,
    }),
    [theme, cycleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
