import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { CategorySidebar } from './CategorySidebar'
import { SocialLinks } from './SocialLinks'
import { useRightRail } from './RightRailContext'
import { getRoutePathname } from '../../utils/useLocalePath'

const INFO_ROUTES = new Set(['/about', '/changelog', '/contact', '/tags', '/privacy'])

export function RightRail() {
  const { pathname } = useLocation()
  const { isHomePage, isPostPage, isBlogPage } = useRightRail()
  const { t } = useI18n()
  const reduce = useReducedMotion()

  /** Info pages, tags, and privacy pages: no category sidebar collapse and no right-rail social links (these pages have their own navigation or need a simpler layout) */
  if (INFO_ROUTES.has(getRoutePathname(pathname))) {
    return null
  }

  const showCategorySidebar = isHomePage || isPostPage || isBlogPage

  return (
    <aside
      className={clsx(
        'right-rail',
        isHomePage && 'right-rail--home',
        isPostPage && 'right-rail--post',
        isBlogPage && 'right-rail--blog',
      )}
      aria-label={t('sidebar.categories')}
    >
      <motion.div
        className="right-rail__enter min-w-0"
        initial={reduce ? false : { clipPath: 'inset(0 0 0 100%)', x: 28 }}
        animate={{ clipPath: 'inset(0 0 0 0%)', x: 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                clipPath: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                x: { type: 'spring', stiffness: 320, damping: 24, mass: 0.85 },
              }
        }
      >
        <div className="right-rail__card">
          <div id="site-right-rail-body" className="right-rail__body">
            {showCategorySidebar && <CategorySidebar />}
            <SocialLinks variant="spread" />
          </div>
        </div>
      </motion.div>
    </aside>
  )
}
