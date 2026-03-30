import { motion, useReducedMotion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useLocalePath, getRoutePathname } from '../../utils/useLocalePath'

const ITEMS = [
  { to: '/', key: 'cat.home', icon: 'fas fa-home' },
  { to: '/about', key: 'cat.about', icon: 'fas fa-user' },
  { to: '/changelog', key: 'cat.changelog', icon: 'fas fa-code-branch' },
  { to: '/contact', key: 'cat.contact', icon: 'fas fa-envelope' },
] as const

const listVariants = {
  hidden: {},
  show: (reduce: boolean) => ({
    transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: reduce ? 0 : 0.08 },
  }),
}

const itemVariants = {
  hidden: (reduce: boolean) =>
    reduce ? { x: 0 } : { x: 22, skewX: -3 },
  show: (reduce: boolean) => ({
    x: 0,
    skewX: 0,
    transition: reduce
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 380, damping: 22, mass: 0.75 },
  }),
}

export function CategorySidebar() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const { getLocalePath } = useLocalePath()
  const reduce = useReducedMotion()
  const routePath = getRoutePathname(pathname)

  return (
    <div className="sidebar-card">
      <h2 className="sidebar-card__title">{t('sidebar.categories')}</h2>
      <motion.ul
        className="cat-list"
        initial="hidden"
        animate="show"
        custom={reduce ?? false}
        variants={listVariants}
      >
        {ITEMS.map((item) => {
          const active = routePath === item.to
          return (
            <motion.li key={item.to} custom={reduce ?? false} variants={itemVariants}>
              <Link
                to={getLocalePath(item.to)}
                className={`cat-link${active ? ' cat-link--active' : ''}`}
              >
                <i className={`${item.icon} cat-list__icon`} aria-hidden />
                {t(item.key)}
              </Link>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
