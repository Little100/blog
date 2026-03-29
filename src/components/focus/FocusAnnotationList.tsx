import { ArrowUp } from 'lucide-react'
import { AnnoBodyText } from '../post/AnnoBodyText'
import { TEXT_ID } from '../post/AnnotationBridges'
import type { MarkdownAnnotation } from '../../utils/annotationMarkdown'
import { annotationTone, sanitizeAnnoIdPrefix } from '../../utils/annotationVariation'

type Props = {
  annotations: MarkdownAnnotation[]
  idPrefix: string
  t: (key: string) => string
}

export function FocusAnnotationList({ annotations, idPrefix, t }: Props) {
  if (annotations.length === 0) return null
  const pid = sanitizeAnnoIdPrefix(idPrefix)

  return (
    <section className="focus-reader__annotations" aria-labelledby="focus-reader-annotations-heading">
      <h2 id="focus-reader-annotations-heading" className="focus-reader__annotations-title">
        {t('post.annotations')}
      </h2>
      <div className="focus-reader__annotation-rail">
        {annotations.map((ann, i) => {
          const tone = annotationTone(pid, i)
          const label = ann.title.trim() ? ann.title.trim() : t('post.annotations')
          return (
            <article
              key={`${i}-${ann.anchorText.slice(0, 24)}`}
              id={`focus-anno-${idPrefix}-${i}`}
              className={`focus-anno-card focus-anno-card--tone-${tone}`}
            >
              <div className="focus-anno-card__head">
                <span className="focus-anno-card__label">{label}</span>
                <button
                  type="button"
                  className="focus-anno-card__to-text"
                  aria-label={t('focus.annotationsToText')}
                  title={t('focus.annotationsToText')}
                  onClick={() =>
                    document.getElementById(TEXT_ID(idPrefix, i))?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                  }
                >
                  <ArrowUp size={16} strokeWidth={2} aria-hidden />
                </button>
              </div>
              <div className="focus-anno-card__row">
                <span className="focus-anno-note__badge" aria-hidden="true">
                  {i + 1}
                </span>
                <AnnoBodyText text={ann.body} className="focus-anno-note__text" />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
