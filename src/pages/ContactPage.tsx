import { siteConfig, resolveLocalized } from '../config/site'
import { useI18n } from '../i18n/I18nContext'
import { SocialLinksWithDetail } from '../components/layout/SocialLinks'

export function ContactPage() {
  const { t, locale } = useI18n()
  const cfg = siteConfig.contact

  const title = resolveLocalized(cfg?.title, locale, t('contact.title'))
  const lead = resolveLocalized(cfg?.lead, locale, t('contact.lead'))
  const leadParagraphs = lead.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

  return (
    <div className="page page--contact">
      <h1 className="page-hero-title">{title}</h1>

      {leadParagraphs.length > 0 && (
        <div className="glass-card contact-card contact-card--full">
          {leadParagraphs.map((paragraph, i) => (
            <p key={i} className="md-p">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      <div className="contact-grid">
        <section className="glass-card contact-card contact-card--social">
          <SocialLinksWithDetail />
        </section>

        {cfg?.sections?.map((section, i) => {
          const icon = resolveLocalized(section.icon, locale, 'fas fa-info-circle')
          const sectionTitle = resolveLocalized(section.title, locale, '')
          const sectionBody = resolveLocalized(section.body, locale, '')
          const paragraphs = sectionBody.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

          return (
            <section key={i} className="glass-card contact-card contact-card--section">
              <div className="contact-section__header">
                <span className="contact-section__icon" aria-hidden>
                  <i className={icon} />
                </span>
                {sectionTitle && (
                  <h2 className="contact-section__title">{sectionTitle}</h2>
                )}
              </div>
              {paragraphs.map((p, j) => (
                <p key={j} className="contact-section__body md-p">{p}</p>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
