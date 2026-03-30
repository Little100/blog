import clsx from 'clsx'
import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BLOGBackdrop } from './BLOGBackdrop'
import { Header } from './Header'
import { RightRail } from './RightRail'
import { RightRailProvider, useRightRail } from './RightRailContext'
import { resolveLocalized, siteConfig } from '../../config/site'
import { useI18nOptional } from '../../i18n/I18nContext'
import { UpdateBanner } from '../UpdateBanner'
import { UpdateNotice } from '../UpdateNotice'
import { BackToTop } from '../BackToTop'
import {
  clearPostRelatedNavigationFlag,
  isPostRelatedSlidePending,
} from '../../utils/postRelatedNav'
import type { Locale } from '../../i18n/translations'
import { getRoutePathname, localePathForRouter } from '../../utils/useLocalePath'

function SiteMain() {
  const location = useLocation()
  const { isHomePage, isPostPage } = useRightRail()
  const reduceMotion = useReducedMotion()
  const postRelatedSlide = isPostRelatedSlidePending()
  const prevPathnameRef = useRef<string | null>(null)
  const [exitingWasPost, setExitingWasPost] = useState(false)

  useLayoutEffect(() => {
    const current = prevPathnameRef.current
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern
    setExitingWasPost(current ? getRoutePathname(current).startsWith('/post/') : false)
    prevPathnameRef.current = location.pathname
  }, [location.pathname])

  return (
    <main
      className={clsx(
        'site-main site-main--wide relative z-[1] mx-auto w-full flex-1 py-[clamp(1.25rem,4vw,2.5rem)]',
        isPostPage
          ? 'site-main--post px-[clamp(1.5rem,5vw,3rem)]'
          : 'px-[clamp(1.25rem,4vw,2.5rem)]',
        isHomePage && 'site-main--home',
      )}
    >
      {/* Annotation bridges portal: same stacking context as article page; below margin cards to avoid covering sidebar annotations */}
      <div className="annotation-bridges-mount" id="annotation-bridges-mount" aria-hidden />
      {/* `sync` keeps two routes mounted briefly; duplicate post layout breaks annotation bridges / ids */}
      <AnimatePresence mode="wait" onExitComplete={clearPostRelatedNavigationFlag}>
        <motion.div
          key={location.pathname}
          className={isPostPage ? 'site-outlet-root--post' : undefined}
          initial={
            reduceMotion
              ? false
              : postRelatedSlide && isPostPage
                ? { opacity: 0 }
              : isPostPage
                ? /* Article page entry animation is handled inside PostPage (body clip + columns); outer opacity would hide child animations */
                  false
                : { opacity: 0, y: 10 }
          }
          animate={
            isPostPage
              ? /* Article page outer layer uses no x/y transform, or it becomes the containing block for fixed positioning, causing margin cards/bridges to misalign */
                { opacity: 1 }
              : { opacity: 1, x: 0, y: 0 }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : postRelatedSlide && exitingWasPost
                ? { opacity: 0 }
                : exitingWasPost
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8 }
          }
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </main>
  )
}

const MINIMAL_FOOTER_ROUTES = new Set(['/tags', '/privacy'])

export function SiteShell() {
  const i18n = useI18nOptional()
  const locale: Locale = i18n?.locale ?? 'en'
  const defaultLocale: Locale = i18n?.defaultLocale ?? 'en'
  const location = useLocation()
  const r = (v: import('../../config/site').LocalizedString | undefined, fb: string) =>
    resolveLocalized(v, locale, fb)

  const localePath = (path: string) => localePathForRouter(path, locale, defaultLocale)
  const hideSiteFooter = MINIMAL_FOOTER_ROUTES.has(getRoutePathname(location.pathname))

  return (
    <RightRailProvider>
      <div className="site-shell relative flex min-h-svh flex-col">
        <BLOGBackdrop />
        <UpdateBanner />
        <Header />
        <SiteMain />
        <RightRail />
        {!hideSiteFooter && (
          <footer className="relative z-[1] flex flex-col items-center gap-2 px-4 pb-8 pt-6 text-center text-[0.85rem] text-[var(--text-muted)]">
            <span>{r(siteConfig.footer.tagline, '')}</span>
            {siteConfig.footer.links && siteConfig.footer.links.length > 0 && (
              <div className="flex gap-4">
                {siteConfig.footer.links.map((link) => (
                  <Link
                    key={link.href}
                    to={localePath(link.href)}
                    className="text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--heading)]"
                  >
                    {r(link.label, '')}
                  </Link>
                ))}
              </div>
            )}
            {siteConfig.footer.copyright && (
              <span>{r(siteConfig.footer.copyright, '')}</span>
            )}
            <UpdateNotice />
          </footer>
        )}
        <BackToTop />
      </div>
    </RightRailProvider>
  )
}
