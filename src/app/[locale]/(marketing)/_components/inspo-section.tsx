'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { InspirationCombo, InspirationSpace } from '@/lib/api/homepage-inspirations'
import { toImageProxyUrl } from '@/lib/image-url'

type Props = {
  combos: ReadonlyArray<InspirationCombo>
  spaces: ReadonlyArray<InspirationSpace>
}

export function InspoSection({ combos, spaces }: Props) {
  const t = useTranslations('home')
  const [active, setActive] = useState('all')

  const visible = active === 'all' ? combos : combos.filter(c => String(c.space_id) === active)

  return (
    <section style={{ padding: 'clamp(64px, 10vw, 120px) 0' }}>
      <div className="container">
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(25px, 3vw, 31px)', letterSpacing: '-0.02em', margin: '0 0 16px' }}>
            {t('inspo_title')}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button
            className={`filter-chip${active === 'all' ? ' active' : ''}`}
            onClick={() => setActive('all')}
          >
            {t('inspo_filter_all')}
          </button>
          {spaces.map(s => (
            <button
              key={s.id}
              className={`filter-chip${active === String(s.id) ? ' active' : ''}`}
              onClick={() => setActive(String(s.id))}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="grid-3">
          {visible.map(item => (
            <div key={item.id} className="inspo-item" style={{ overflow: 'hidden' }}>
              {item.image_url ? (
                <img
                  src={toImageProxyUrl(item.image_url)}
                  alt={item.label}
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block', transition: 'transform 700ms ease-out' }}
                  onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseOut={e => (e.currentTarget.style.transform = '')}
                />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', background: '#E8E6E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#999', fontSize: '12px', fontFamily: "'PP Air Mono',monospace" }}>{t('inspo_coming_soon')}</span>
                </div>
              )}
              <p style={{ fontSize: '12px', color: '#000', marginTop: '12px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <div className="products-footer">
          <Link href="/inspirations" className="mega-cta-discover">
            <span className="cta-label">{t('inspo_discover')}</span>
            <span className="cta-action">{t('inspo_all')} <span className="cta-arrow">→</span></span>
          </Link>
        </div>
      </div>
    </section>
  )
}
