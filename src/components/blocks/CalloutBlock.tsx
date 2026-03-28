import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MarkdownDocument } from '../../markdown/MarkdownDocument'
import { useI18n } from '../../i18n/I18nContext'
import type { CalloutTitleSpec } from '../../markdown/segmentTypes'

type Props = {
  body: string
  icon?: string
  collapsible?: boolean
  defaultOpen?: boolean
  collapsibleTitle?: CalloutTitleSpec
}

export function CalloutBlock({
  body,
  icon = 'circle-question',
  collapsible = false,
  defaultOpen = true,
  collapsibleTitle = { mode: 'default' },
}: Props) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const reduce = useReducedMotion()

  const trimmed = body.trim()
  if (!trimmed) return null

  const headlineText =
    collapsibleTitle.mode === 'default'
      ? isOpen
        ? ''
        : t('callout.collapsedDefaultTitle')
      : collapsibleTitle.text

  return (
    <aside className="calloutblock" aria-label={t('callout.aria')}>
      {collapsible ? (
        <div className="calloutblock__collapsible-grid">
          <span className="calloutblock__mark" aria-hidden>
            <i className={`fas fa-${icon} calloutblock__fa-icon`} />
          </span>
          <div className="calloutblock__headline">
            {headlineText ? (
              <span className="calloutblock__headline-text">{headlineText}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="calloutblock__toggle"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-label={isOpen ? t('callout.collapse') : t('callout.expand')}
          >
            <motion.i
              className={`fas fa-chevron-down calloutblock__fa-icon calloutblock__chevron`}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                className="calloutblock__collapsible-body calloutblock__collapsible-body--open overflow-hidden"
                initial={reduce ? { height: 0 } : { height: 0, clipPath: 'inset(0 0 100% 0)' }}
                animate={{ height: 'auto', clipPath: 'inset(0 0 0% 0)' }}
                exit={
                  reduce
                    ? { height: 0 }
                    : { height: 0, clipPath: 'inset(0 0 100% 0)' }
                }
                transition={
                  reduce
                    ? { duration: 0.12 }
                    : {
                        height: { type: 'spring', stiffness: 420, damping: 32 },
                        clipPath: { duration: 0.36, ease: [0.32, 0.72, 0, 1] },
                      }
                }
              >
                <MarkdownDocument source={trimmed} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="calloutblock__row">
          <span className="calloutblock__mark" aria-hidden>
            <i className={`fas fa-${icon} calloutblock__fa-icon`} />
          </span>
          <div className="calloutblock__content">
            <MarkdownDocument source={trimmed} />
          </div>
        </div>
      )}
    </aside>
  )
}
