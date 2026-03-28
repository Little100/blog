import { siteConfig, resolveLocalized, type SocialPlatform } from '../../config/site'
import { useI18n } from '../../i18n/I18nContext'
import clsx from 'clsx'

const PLATFORM_ICON: Record<SocialPlatform, string> = {
  github: 'fab fa-github',
  instagram: 'fab fa-instagram',
  twitter: 'fab fa-x-twitter',
  x: 'fab fa-x-twitter',
  linkedin: 'fab fa-linkedin-in',
  mastodon: 'fab fa-mastodon',
  email: 'fas fa-envelope',
}

type Props = {
  /** spread: stretches horizontally to fill the container, preventing large blank space on the right side of cards */
  variant?: 'default' | 'spread'
}

export function SocialLinks({ variant = 'default' }: Props) {
  const { locale } = useI18n()

  return (
    <div className="sidebar-card sidebar-card--social">
      <div
        className={clsx(
          'social-row',
          variant === 'spread' && 'social-row--spread',
        )}
      >
        {siteConfig.social.map((s) => {
          const isMail = s.platform === 'email' || s.href.startsWith('mailto:')
          const iconClass = s.icon ?? PLATFORM_ICON[s.platform]
          const label = resolveLocalized(s.label, locale, '')
          return (
            <a
              key={`${s.platform}-${s.href}`}
              className="social-btn social-btn--icon"
              href={s.href}
              {...(isMail ? {} : { target: '_blank', rel: 'noreferrer' })}
              aria-label={label}
            >
              <i className={`${iconClass} social-fa-icon`} aria-hidden />
            </a>
          )
        })}
      </div>
    </div>
  )
}

/** Social links with optional subtitle rows — used on the Contact page */
export function SocialLinksWithDetail() {
  const { locale } = useI18n()

  return (
    <div className="contact-social-list">
      {siteConfig.social.map((s) => {
        const isMail = s.platform === 'email' || s.href.startsWith('mailto:')
        const iconClass = s.icon ?? PLATFORM_ICON[s.platform]
        const label = resolveLocalized(s.label, locale, '')
        const detail = resolveLocalized(s.detail, locale, '')
        return (
          <a
            key={`${s.platform}-${s.href}`}
            className="contact-social-row"
            href={s.href}
            {...(isMail ? {} : { target: '_blank', rel: 'noreferrer' })}
          >
            <span className="contact-social-row__icon" aria-hidden>
              <i className={`${iconClass}`} />
            </span>
            <span className="contact-social-row__text">
              <span className="contact-social-row__label">{label}</span>
              {detail && (
                <span className="contact-social-row__detail">{detail}</span>
              )}
            </span>
            <span className="contact-social-row__arrow" aria-hidden>
              <i className="fas fa-arrow-right" />
            </span>
          </a>
        )
      })}
    </div>
  )
}
