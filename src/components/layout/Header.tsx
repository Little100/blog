import clsx from 'clsx'
import {
  BookOpen,
  FileText,
  GitBranch,
  House,
  Mail,
  Moon,
  Search,
  Sun,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useRef, useState, useMemo } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeContext'
import { useI18n } from '../../i18n/I18nContext'
import { LOCALE_DEFS } from '../../i18n/translations'
import { useArticleFocus } from '../../focus/ArticleFocusContext'
import { siteConfig } from '../../config/site'
import { LocaleSwitcher } from './LocaleSwitcher'
import type { Locale } from '../../i18n/translations'

const UPDATE_CFG = (siteConfig as Record<string, unknown>).updates as
  | { enabled: boolean; repo: string }
  | undefined

function siteRepoUrl(): string {
  const repo = UPDATE_CFG?.repo ?? 'Little100/blog'
  return `https://github.com/${repo}`
}

function getLocalePath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (locale === 'en') return normalized
  return `/${locale}${normalized}`
}

function getCleanPath(pathname: string): string {
  return pathname.replace(/^\/(en|ja|zh|zh-TW)/, '') || '/'
}

const nav: readonly { to: string; key: string; Icon: LucideIcon }[] = [
  { to: '/', key: 'nav.home', Icon: House },
  { to: '/about', key: 'nav.about', Icon: UserRound },
  { to: '/blog', key: 'nav.blog', Icon: FileText },
  { to: '/changelog', key: 'nav.changelog', Icon: GitBranch },
  { to: '/contact', key: 'nav.contact', Icon: Mail },
]

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme, cycleTheme } = useTheme()
  const { t, locale, setLocale, availableLocales } = useI18n()
  const localeChoices = LOCALE_DEFS.filter((d) => availableLocales.includes(d.code))
  const { focusAvailable, openArticleFocus } = useArticleFocus()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [localSearchQ, setLocalSearchQ] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const headerSearchId = useId()

  // Clean path without locale prefix for comparison
  const cleanPath = useMemo(() => getCleanPath(pathname), [pathname])
  const isHome = cleanPath === '/'
  const isBlogList = cleanPath === '/blog'
  const blogQ = searchParams.get('q') ?? ''
  const searchValue = isBlogList ? blogQ : localSearchQ
  const reduce = useReducedMotion()

  // Helper to get locale-prefixed path
  const localePath = (path: string) => getLocalePath(path, locale)

  const setSearchValue = (v: string) => {
    if (isBlogList) {
      const next = new URLSearchParams(searchParams)
      if (v.trim()) next.set('q', v)
      else next.delete('q')
      setSearchParams(next, { replace: true })
    } else {
      setLocalSearchQ(v)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: sync UI state with URL params
    if (isBlogList && blogQ) setSearchOpen(true)
  }, [isBlogList, blogQ])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: sync UI state with URL params
    if (isBlogList) setLocalSearchQ(blogQ)
  }, [isBlogList, blogQ])

  const toggleHeaderSearch = () => {
    if (searchOpen) {
      setSearchOpen(false)
      return
    }
    setSearchOpen(true)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  const submitHeaderSearch = () => {
    const q = searchValue.trim()
    if (isBlogList) {
      if (!q) setSearchParams({}, { replace: true })
      return
    }
    navigate(q ? `${localePath('/blog')}?q=${encodeURIComponent(q)}` : localePath('/blog'))
    setSearchOpen(false)
  }

  return (
    <header
      className={clsx(
        'sticky top-0 z-20 flex flex-col gap-1 border-b border-[var(--glass-border)] px-[clamp(1rem,4vw,2.5rem)] pb-3 pt-2 backdrop-blur-xl transition-[background-color,backdrop-filter,border-color] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        'bg-[color-mix(in_srgb,var(--page-bg)_78%,transparent)]',
      )}
    >
      <div className="site-header__main flex w-full flex-wrap items-center gap-x-4 gap-y-2 max-[900px]:grid max-[900px]:grid-cols-[48px_1fr_auto] max-[900px]:items-start max-[900px]:gap-x-2 max-[900px]:gap-y-1">
        <button
          type="button"
          className={clsx(
            'site-menu-toggle hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border-0 bg-[var(--pill-bg)] text-[var(--text)] max-[900px]:inline-flex max-[900px]:row-start-1 max-[900px]:self-center',
            menuOpen && 'site-menu-toggle--open',
          )}
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="sr-only">
            {menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          </span>
          <span className="hamburger" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>

        <Link
          to={localePath('/')}
          className="site-brand inline-flex items-center gap-3 text-[var(--heading)] no-underline max-[900px]:col-start-2 max-[900px]:row-start-1 max-[900px]:flex max-[900px]:max-w-[16rem] max-[900px]:flex-col max-[900px]:items-center max-[900px]:justify-self-center max-[900px]:gap-2 max-[900px]:px-1 max-[900px]:text-center"
          onClick={() => setMenuOpen(false)}
        >
          <img
            className="site-avatar-img h-11 w-11 max-[900px]:h-12 max-[900px]:w-12 border-2 border-[var(--glass-border)] object-cover"
            src={siteConfig.avatar}
            width={44}
            height={44}
            alt=""
          />
          <span className="site-title max-[900px]:text-[1.05rem] max-[900px]:leading-tight font-serif text-[1.2rem] font-semibold italic tracking-wide">
            {siteConfig.title}
          </span>
        </Link>

        <div className="site-header__end ml-auto flex flex-wrap items-center gap-2 sm:gap-3 max-[900px]:col-start-3 max-[900px]:row-start-1 max-[900px]:ml-0 max-[900px]:self-center">
          <nav
            className="site-nav site-nav--desktop hidden min-[901px]:flex min-[901px]:flex-wrap min-[901px]:justify-end gap-2"
            aria-label="Main"
          >
            {nav.map((item) => {
              const active =
                item.to === '/'
                  ? cleanPath === '/'
                  : cleanPath === item.to || cleanPath.startsWith(`${item.to}/`)
              const { Icon } = item
              return (
                <Link
                  key={item.to}
                  to={localePath(item.to)}
                  className={clsx(
                    'nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] no-underline transition-colors',
                    active
                      ? 'bg-[var(--pill-active)] text-[var(--pill-active-fg)]'
                      : 'border border-transparent bg-[var(--pill-bg)] text-[var(--text)] hover:border-[var(--glass-border)]',
                  )}
                >
                  <Icon size={18} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                  {t(item.key)}
                </Link>
              )
            })}
          </nav>

          <div
            className={clsx(
              'site-header__tools flex items-center gap-1.5',
              searchOpen && 'site-header__tools--search-open',
            )}
          >
            {localeChoices.length > 1 ? (
              <LocaleSwitcher
                locale={locale}
                setLocale={setLocale}
                choices={localeChoices}
                ariaLabel={t('nav.language')}
                variant="compact"
              />
            ) : null}
            <div className="header-inline-search">
              <input
                ref={searchInputRef}
                id={headerSearchId}
                type="search"
                className={clsx('header-inline-search__input', searchOpen && 'header-inline-search__input--open')}
                placeholder={t('blog.searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitHeaderSearch()
                  }
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
                aria-label={t('blog.searchPlaceholder')}
                autoComplete="off"
              />
              <button
                type="button"
                className="icon-btn header-inline-search__toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent bg-[var(--pill-bg)] text-[var(--text)] transition-colors hover:border-[var(--glass-border)]"
                aria-label={t('nav.search')}
                aria-expanded={searchOpen}
                aria-controls={headerSearchId}
                onClick={() => toggleHeaderSearch()}
              >
                <Search size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>
            {!isHome ? (
              <button
                type="button"
                className="icon-btn focus-header-btn inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-[var(--pill-bg)] text-[var(--text)] transition-colors hover:border-[var(--glass-border)] disabled:cursor-not-allowed disabled:opacity-[0.38]"
                disabled={!focusAvailable}
                onClick={() => {
                  openArticleFocus()
                  setMenuOpen(false)
                }}
                aria-label={t('nav.focusMode')}
                title={focusAvailable ? t('nav.focusMode') : t('nav.unavailable')}
              >
                <BookOpen size={20} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              className="theme-toggle theme-toggle--desktop inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--pill-bg)] px-3 font-[inherit] text-[var(--text)] transition-colors hover:border-[var(--pill-active)]"
              onClick={cycleTheme}
              aria-label={t('nav.themeCycle')}
              title={t('nav.themeCycle')}
            >
              {theme === 'dark' ? (
                <Moon size={18} strokeWidth={2} aria-hidden />
              ) : (
                <Sun size={18} strokeWidth={2} aria-hidden />
              )}
            </button>
            <a
              href={siteRepoUrl()}
              target="_blank"
              rel="noreferrer"
              className="icon-btn inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-[var(--pill-bg)] text-[var(--text)] no-underline transition-colors hover:border-[var(--glass-border)]"
              aria-label={t('nav.BLOGRepo')}
              title={t('nav.BLOGRepo')}
            >
              <i className="fab fa-github social-fa-icon" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="site-mobile-nav"
            className="site-mobile-panel w-full min-[901px]:hidden"
            initial={reduce ? { height: 0 } : { height: 0, clipPath: 'inset(100% 0 0 0)' }}
            animate={{ height: 'auto', clipPath: 'inset(0 0 0 0)' }}
            exit={
              reduce
                ? { height: 0 }
                : { height: 0, clipPath: 'inset(100% 0 0 0)' }
            }
            transition={
              reduce
                ? { duration: 0.15 }
                : {
                    height: { type: 'spring', stiffness: 380, damping: 32 },
                    clipPath: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                  }
            }
          >
            <div className="site-mobile-panel__inner pb-3">
              <nav className="site-nav site-nav--mobile flex flex-col items-stretch gap-2 pt-2" aria-label="Mobile">
                {nav.map((item, i) => {
                  const active =
                    item.to === '/'
                      ? cleanPath === '/'
                      : cleanPath === item.to || cleanPath.startsWith(`${item.to}/`)
                  const { Icon } = item
                  return (
                    <motion.div
                      key={item.to}
                      initial={reduce ? { x: 0 } : { x: -36 }}
                      animate={{ x: 0 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : {
                              type: 'spring',
                              stiffness: 360,
                              damping: 20,
                              mass: 0.8,
                              delay: i * 0.045,
                            }
                      }
                    >
                      <Link
                        to={localePath(item.to)}
                        className={clsx(
                          'nav-pill inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-center text-[0.95rem] no-underline',
                          active
                            ? 'bg-[var(--pill-active)] text-[var(--pill-active-fg)]'
                            : 'border border-transparent bg-[var(--pill-bg)] text-[var(--text)]',
                        )}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon size={18} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                        {t(item.key)}
                      </Link>
                    </motion.div>
                  )
                })}
                {!isHome ? (
                  <motion.div
                    initial={reduce ? { x: 0 } : { x: -36 }}
                    animate={{ x: 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 360,
                            damping: 20,
                            mass: 0.8,
                            delay: nav.length * 0.045,
                          }
                    }
                  >
                    <button
                      type="button"
                      className="nav-pill inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--pill-bg)] px-4 py-2 text-[0.95rem] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!focusAvailable}
                      onClick={() => {
                        openArticleFocus()
                        setMenuOpen(false)
                      }}
                    >
                      <BookOpen size={18} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                      {t('nav.focusMode')}
                    </button>
                  </motion.div>
                ) : null}
                {localeChoices.length > 1 ? (
                  <motion.div
                    className="flex flex-col gap-1 px-1"
                    initial={reduce ? { x: 0 } : { x: -36 }}
                    animate={{ x: 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 360,
                            damping: 20,
                            mass: 0.8,
                            delay: (nav.length + (!isHome ? 1 : 0)) * 0.045,
                          }
                    }
                  >
                    <span className="text-left text-[0.75rem] text-[var(--text-muted)]">
                      {t('nav.language')}
                    </span>
                    <LocaleSwitcher
                      locale={locale}
                      setLocale={setLocale}
                      choices={localeChoices}
                      ariaLabel={t('nav.language')}
                      variant="full"
                      onAfterPick={() => setMenuOpen(false)}
                    />
                  </motion.div>
                ) : null}
                <motion.button
                  type="button"
                  className="nav-pill theme-toggle flex items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--pill-bg)] px-4 py-2 font-[inherit] text-[var(--text)]"
                  onClick={cycleTheme}
                  initial={reduce ? { x: 0 } : { x: -36 }}
                  animate={{ x: 0 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 360,
                          damping: 20,
                          mass: 0.8,
                          delay:
                            (nav.length + (!isHome ? 2 : 1) + (localeChoices.length > 1 ? 1 : 0)) *
                            0.045,
                        }
                  }
                >
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  {t('nav.themeCycle')}
                </motion.button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
