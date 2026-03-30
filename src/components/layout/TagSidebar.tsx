import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import { useLocalePath } from '../../utils/useLocalePath'
import { POST_INDEX_BY_LOCALE } from '../../i18n/postIndex'
import { aggregateTagsFromPosts } from '../../utils/blogTags'

export function TagSidebar() {
  const { t, locale } = useI18n()
  const { getLocalePath } = useLocalePath()
  const reduce = useReducedMotion()

  const tags = useMemo(
    () => aggregateTagsFromPosts(POST_INDEX_BY_LOCALE[locale] ?? []),
    [locale],
  )

  const listVariants = {
    hidden: {},
    show: (reduce: boolean) => ({
      transition: { staggerChildren: reduce ? 0 : 0.04, delayChildren: reduce ? 0 : 0.06 },
    }),
  }

  const itemVariants = {
    hidden: (reduce: boolean) =>
      reduce ? { x: 0 } : { x: 14, skewX: -2 },
    show: (reduce: boolean) => ({
      x: 0,
      skewX: 0,
      transition: reduce
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 380, damping: 22, mass: 0.75 },
    }),
  }

  return (
    <div className="sidebar-card">
      <div className="sidebar-card__title-row">
        <h2 className="sidebar-card__title">{t('sidebar.tags')}</h2>
        <Link to={getLocalePath('/tags')} className="sidebar-card__title-link">
          {t('sidebar.tagsViewAll')}
        </Link>
      </div>
      <motion.ul
        className="tag-sidebar-list"
        initial="hidden"
        animate="show"
        custom={reduce ?? false}
        variants={listVariants}
      >
        {tags.map((tag) => (
          <motion.li key={tag.slug} custom={reduce ?? false} variants={itemVariants}>
            <Link
              to={`${getLocalePath('/blog')}?tag=${encodeURIComponent(tag.slug)}`}
              className="tag-sidebar-link"
            >
              <span className="tag-sidebar-link__name">{tag.label}</span>
              <span className="tag-sidebar-link__count">{tag.count}</span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}
