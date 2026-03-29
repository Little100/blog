import { useI18n } from '../i18n/I18nContext'
import { siteConfig } from '../config/site'
import { publicAssetUrl } from '../utils/publicAssetUrl'

const skills = [
  { key: 'skill.coding', icon: 'fas fa-code' },
  { key: 'skill.design', icon: 'fas fa-palette' },
  { key: 'skill.writing', icon: 'fas fa-pen-nib' },
  { key: 'skill.photo', icon: 'fas fa-camera-retro' },
] as const

const lately = [
  { key: 'about.lately.read', icon: 'fas fa-book-open' },
  { key: 'about.lately.walk', icon: 'fas fa-person-walking' },
  { key: 'about.lately.type', icon: 'fas fa-font' },
  { key: 'about.lately.blog', icon: 'fas fa-layer-group' },
] as const

export function AboutPage() {
  const { t } = useI18n()

  return (
    <div className="page page--about">
      <div className="about-page__layout">
        <h1 className="page-hero-title about-page__title">{t('about.title')}</h1>

        <div className="about-hero glass-card about-page__hero">
          <img className="about-avatar" src={publicAssetUrl(siteConfig.avatar)} width={120} height={120} alt="" />
          <div className="about-hero__text">
            <h2 className="about-section-title">{t('about.story')}</h2>
            <p className="md-p">{t('about.story.p1')}</p>
            <p className="md-p">{t('about.story.p2')}</p>
          </div>
        </div>

        <div className="about-grid about-page__grid">
          <section className="glass-card about-card">
            <h2 className="about-section-title">{t('about.skills')}</h2>
            <ul className="skills-list">
              {skills.map((s) => (
                <li key={s.key} className="skills-list__item">
                  <span className="skills-list__icon" aria-hidden>
                    <i className={`${s.icon} skills-list__fa-icon`} />
                  </span>
                  {t(s.key)}
                </li>
              ))}
            </ul>
          </section>
          <section className="glass-card about-card">
            <h2 className="about-section-title">{t('about.lately')}</h2>
            <ul className="skills-list">
              {lately.map((item) => (
                <li key={item.key} className="skills-list__item">
                  <span className="skills-list__icon" aria-hidden>
                    <i className={`${item.icon} skills-list__fa-icon`} />
                  </span>
                  {t(item.key)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
