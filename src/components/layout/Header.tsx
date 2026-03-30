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
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeContext'
import { useI18nOptional } from '../../i18n/I18nContext'
import { LOCALE_DEFS } from '../../i18n/translations'
import { useArticleFocus } from '../../focus/ArticleFocusContext'
import { siteConfig } from '../../config/site'
import { publicAssetUrl } from '../../utils/publicAssetUrl'
import { LocaleSwitcher } from './LocaleSwitcher'
import { stripBasePath } from '../../config/basePath'
import { localePathForRouter } from '../../utils/useLocalePath'
import type { Locale } from '../../i18n/translations'

const UPDATE_CFG = (siteConfig as Record<string, unknown>).updates as
  | { enabled: boolean; repo: string }
  | undefined

function siteRepoUrl(): string {
  const repo = UPDATE_CFG?.repo ?? 'Little100/blog'
  return `https://github.com/${repo}`
}

function getCleanPath(pathname: string): string {
  // Strip base path first (dev/prod), then strip locale prefix.
  const afterBase = stripBasePath(pathname)
  // Note: zh-TW must appear before zh so the alternation matches the longer variant first.
  return afterBase.replace(/^\/(en|ja|zh-TW|zh)/, '') || '/'
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
  // useI18nOptional: Header may render before I18nProvider is fully mounted during fast HMR reconnections.
  const ctx = useI18nOptional()
  const t = ctx?.t ?? ((k: string) => k)
  const locale: Locale = ctx?.locale ?? 'en'
  const defaultLocale: Locale = ctx?.defaultLocale ?? 'en'
  const setLocale = ctx?.setLocale ?? (() => {})
  const availableLocales = ctx?.availableLocales ?? (['en'] as Locale[])
  const localeChoices = LOCALE_DEFS.filter((d) => availableLocales.includes(d.code))
  const { focusAvailable, openArticleFocus } = useArticleFocus()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [localSearchQ, setLocalSearchQ] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const desktopSearchRef = useRef<HTMLDivElement>(null)
  const mobileToggleRef = useRef<HTMLButtonElement>(null)
  const mobileSearchRowRef = useRef<HTMLDivElement>(null)
  const headerSearchId = useId()
  const narrowHeader = useMediaQuery('(max-width: 900px)')
  const searchInputIdDesktop = `${headerSearchId}-d`
  const searchInputIdMobile = `${headerSearchId}-m`

  // Clean path without locale prefix for comparison
  const cleanPath = useMemo(() => getCleanPath(pathname), [pathname])
  const isHome = cleanPath === '/'
  const isBlogList = cleanPath === '/blog'
  const blogQ = searchParams.get('q') ?? ''
  const searchValue = isBlogList ? blogQ : localSearchQ
  const reduce = useReducedMotion()

  const localePath = (path: string) => localePathForRouter(path, locale, defaultLocale)

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

  const handleSearchBlur = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.activeElement
      if (!(el instanceof Node)) {
        setSearchOpen(false)
        return
      }
      if (desktopSearchRef.current?.contains(el)) return
      if (mobileToggleRef.current?.contains(el)) return
      if (mobileSearchRowRef.current?.contains(el)) return
      setSearchOpen(false)
    })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: sync UI state with URL params
    if (isBlogList) setLocalSearchQ(blogQ)
  }, [isBlogList, blogQ])

  const toggleHeaderSearch = () => {
    if (searchOpen) {
      setSearchOpen(false)
      searchInputRef.current?.blur()
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
      <div className="site-header__main flex w-full flex-wrap items-center gap-x-4 gap-y-2 max-[900px]:flex-col max-[900px]:items-stretch max-[900px]:gap-2">
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 min-[901px]:contents max-[900px]:grid max-[900px]:grid-cols-[48px_1fr_auto] max-[900px]:items-center max-[900px]:gap-x-2 max-[900px]:gap-y-1">
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
          className="site-brand inline-flex min-w-0 items-center gap-3 text-[var(--heading)] no-underline max-[900px]:col-start-2 max-[900px]:row-start-1 max-[900px]:flex max-[900px]:max-w-[16rem] max-[900px]:flex-col max-[900px]:items-center max-[900px]:justify-self-center max-[900px]:gap-2 max-[900px]:px-1 max-[900px]:text-center"
          onClick={() => setMenuOpen(false)}
        >
          <img
            className="site-avatar-img h-11 w-11 max-[900px]:h-12 max-[900px]:w-12 border-2 border-[var(--glass-border)] object-cover"
            src={publicAssetUrl(siteConfig.avatar)}
            width={44}
            height={44}
            alt=""
          />
          <span className="site-title max-[900px]:text-[1.05rem] max-[900px]:leading-tight font-serif text-[1.2rem] font-semibold italic tracking-wide">
            {siteConfig.title}
          </span>
        </Link>

        <div className="site-header__end ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 max-[900px]:col-start-3 max-[900px]:row-start-1 max-[900px]:ml-0 max-[900px]:self-center">
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

          <div className="site-header__tools flex shrink-0 items-center gap-1.5">
            {localeChoices.length > 1 ? (
              <LocaleSwitcher
                locale={locale}
                defaultLocale={defaultLocale}
                setLocale={setLocale}
                choices={localeChoices}
                ariaLabel={t('nav.language')}
                variant="compact"
              />
            ) : null}
            {narrowHeader ? (
              <button
                ref={mobileToggleRef}
                type="button"
                className="icon-btn header-inline-search__toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent bg-[var(--pill-bg)] text-[var(--text)] transition-colors hover:border-[var(--glass-border)]"
                aria-label={t('nav.search')}
                aria-expanded={searchOpen}
                aria-controls={searchInputIdMobile}
                onClick={() => toggleHeaderSearch()}
              >
                <Search size={20} strokeWidth={2} aria-hidden />
              </button>
            ) : (
              <div ref={desktopSearchRef} className="header-inline-search">
                <input
                  ref={searchInputRef}
                  id={searchInputIdDesktop}
                  type="search"
                  className={clsx(
                    'header-inline-search__input',
                    searchOpen && 'header-inline-search__input--open',
                  )}
                  placeholder={t('blog.searchPlaceholder')}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={handleSearchBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submitHeaderSearch()
                    }
                    if (e.key === 'Escape') {
                      setSearchOpen(false)
                      e.currentTarget.blur()
                    }
                  }}
                  aria-label={t('blog.searchPlaceholder')}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="icon-btn header-inline-search__toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent bg-[var(--pill-bg)] text-[var(--text)] transition-colors hover:border-[var(--glass-border)]"
                  aria-label={t('nav.search')}
                  aria-expanded={searchOpen}
                  aria-controls={searchInputIdDesktop}
                  onClick={() => toggleHeaderSearch()}
                >
                  <Search size={20} strokeWidth={2} aria-hidden />
                </button>
              </div>
            )}
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

        <AnimatePresence mode="sync">
          {narrowHeader && searchOpen ? (
            <motion.div
              key="header-mobile-search"
              ref={mobileSearchRowRef}
              className="site-header__search-row flex w-full min-w-0 items-center gap-2 overflow-hidden"
              initial={reduce ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
              transition={
                reduce
                  ? { duration: 0.12 }
                  : {
                      height: { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 },
                      opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                    }
              }
            >
              <input
                ref={searchInputRef}
                id={searchInputIdMobile}
                type="search"
                className="site-header__search-row-input min-w-0 flex-1"
                placeholder={t('blog.searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={handleSearchBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitHeaderSearch()
                  }
                  if (e.key === 'Escape') {
                    setSearchOpen(false)
                    e.currentTarget.blur()
                  }
                }}
                aria-label={t('blog.searchPlaceholder')}
                autoComplete="off"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="site-mobile-nav"
            className={clsx(
              'site-mobile-panel w-full min-[901px]:hidden',
              /* CSS accordion uses grid 0fr→1fr; without --open the row stays collapsed */
              menuOpen && 'site-mobile-panel--open',
            )}
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
              <nav className="site-nav site-nav--mobile pt-2" aria-label="Mobile">
                <div className="site-nav--mobile__primary">
                  {nav.map((item, i) => {
                    const active =
                      item.to === '/'
                        ? cleanPath === '/'
                        : cleanPath === item.to || cleanPath.startsWith(`${item.to}/`)
                    const { Icon } = item
                    return (
                      <motion.div
                        key={item.to}
                        className="max-w-full min-w-0"
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
                            'nav-pill nav-pill--mobile-tile inline-flex max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-full px-3 py-2 text-[0.9rem] no-underline',
                            active
                              ? 'bg-[var(--pill-active)] text-[var(--pill-active-fg)]'
                              : 'border border-transparent bg-[var(--pill-bg)] text-[var(--text)]',
                          )}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Icon size={18} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                          <span className="min-w-0 truncate">{t(item.key)}</span>
                        </Link>
                      </motion.div>
                    )
                  })}
                  {!isHome ? (
                    <motion.div
                      className="max-w-full min-w-0"
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
                        className="nav-pill nav-pill--mobile-tile inline-flex max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-full border border-transparent bg-[var(--pill-bg)] px-3 py-2 text-[0.9rem] disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={!focusAvailable}
                        onClick={() => {
                          openArticleFocus()
                          setMenuOpen(false)
                        }}
                      >
                        <BookOpen size={18} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                        <span className="min-w-0 truncate">{t('nav.focusMode')}</span>
                      </button>
                    </motion.div>
                  ) : null}
                </div>
                {localeChoices.length > 1 ? (
                  <motion.div
                    className="site-nav--mobile__full flex w-full flex-col gap-1 px-0.5"
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
                      defaultLocale={defaultLocale}
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
                  className="nav-pill theme-toggle site-nav--mobile__full flex w-full items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--pill-bg)] px-4 py-2 font-[inherit] text-[0.9rem] text-[var(--text)]"
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
