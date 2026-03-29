import clsx from 'clsx'
import { ChevronDown, Languages } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Locale } from '../../i18n/translations'

type LocaleChoice = { code: Locale; label: string; flag: string }

type LocaleSwitcherProps = {
  locale: Locale
  setLocale: (next: Locale) => void
  choices: LocaleChoice[]
  ariaLabel: string
  /** Wider touch targets and full-width menu (mobile drawer) */
  variant?: 'compact' | 'full'
  /** e.g. close mobile nav after picking a locale */
  onAfterPick?: () => void
}

export function LocaleSwitcher({
  locale,
  setLocale,
  choices,
  ariaLabel,
  variant = 'compact',
  onAfterPick,
}: LocaleSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const reduce = useReducedMotion()
  const current = choices.find((c) => c.code === locale) ?? choices[0]
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Strip locale prefix AND the /blog "section" prefix from current path to get the
  // "inner" route path.  All page routes (blog/post/:slug, about, etc.) are defined once
  // under /blog in config, then reused for every locale.  Stripping /blog ensures
  // language-switching navigates to the correct inner route without duplication.
  const cleanPath = pathname
    .replace(/^\/(en|ja|zh|zh-TW)/, '') // strip locale prefix
    .replace(/^\/blog/, '')              // strip /blog section wrapper
    .replace(/^\/*/, '/') || '/'

  const navigateToLocale = (targetLocale: Locale) => {
    const targetPath = targetLocale === 'en' ? cleanPath : `/${targetLocale}${cleanPath}`
    navigate(targetPath)
    setLocale(targetLocale)
    setOpen(false)
    onAfterPick?.()
  }

  /** Portalled to body with fixed positioning; avoids being nested inside the header backdrop-blur so backdrop-filter samples the sidebar/main content correctly */
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const el = rootRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Node)) return
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!current) return null

  const full = variant === 'full'

  return (
    <div ref={rootRef} className={clsx('relative', full && 'w-full')}>
      <button
        type="button"
        className={clsx(
          'site-locale-trigger flex items-center rounded-xl bg-[var(--pill-bg)] text-[var(--text)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--question-accent)_45%,transparent)]',
          full
            ? 'w-full justify-between gap-2 border border-[var(--glass-border)] px-3 py-2.5 text-[0.9rem] hover:border-[var(--pill-active)]'
            : 'icon-btn h-10 w-10 shrink-0 justify-center border border-transparent hover:border-[var(--glass-border)]',
        )}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        {full ? (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-base leading-none" aria-hidden>
                {current.flag}
              </span>
              <span className="truncate">{current.label}</span>
            </span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              aria-hidden
            >
              <ChevronDown
                size={18}
                strokeWidth={2}
                className="shrink-0 opacity-70"
              />
            </motion.span>
          </>
        ) : (
          <Languages size={20} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
        )}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && menuPos && (
            <motion.ul
              key="site-locale-menu"
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className={clsx(
                'site-locale-menu fixed z-[100] overflow-hidden rounded-xl border py-1 shadow-[var(--glass-shadow)]',
                'border-[color-mix(in_srgb,var(--glass-border)_92%,transparent)]',
                'bg-[color-mix(in_srgb,var(--glass-bg)_72%,transparent)]',
                'backdrop-blur-xl backdrop-saturate-[1.35]',
                '[box-shadow:var(--glass-shadow),inset_0_1px_0_0_color-mix(in_srgb,white_8%,transparent)]',
                'dark:[box-shadow:var(--glass-shadow),inset_0_1px_0_0_color-mix(in_srgb,white_6%,transparent)]',
                !full && 'min-w-[11rem]',
              )}
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: full ? menuPos.width : undefined,
                transformOrigin: '50% 0%',
              }}
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
                      y: { type: 'spring', stiffness: 420, damping: 28 },
                    }
              }
            >
              {choices.map((c, i) => {
                const selected = c.code === locale
                return (
                  <motion.li
                    key={c.code}
                    role="presentation"
                    initial={reduce ? { x: 0 } : { x: -18 }}
                    animate={{ x: 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 400,
                            damping: 22,
                            delay: i * 0.045,
                          }
                    }
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={clsx(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-[0.85rem] transition-colors',
                        selected
                          ? 'bg-[color-mix(in_srgb,var(--pill-active)_22%,transparent)] text-[var(--text)]'
                          : 'text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--pill-bg)_88%,var(--text)_4%)] hover:text-[var(--text)]',
                      )}
                      onClick={() => navigateToLocale(c.code)}
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {c.flag}
                      </span>
                      <span>{c.label}</span>
                    </button>
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
