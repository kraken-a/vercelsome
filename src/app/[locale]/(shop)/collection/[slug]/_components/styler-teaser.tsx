'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const EXT_COLORS = [
  { name: 'Pure White', hex: '#FAFAFA', border: true },
  { name: 'Silk Grey',  hex: '#D8D5D0' },
  { name: 'Anthracite', hex: '#2C2C2C' },
  { name: 'Graphite',   hex: '#555555' },
  { name: 'Snow',       hex: '#F0EFE9', border: true },
  { name: 'Pearl',      hex: '#D8D2C2' },
  { name: 'Slate',      hex: '#708090' },
  { name: 'Obsidian',   hex: '#1A1A1A' },
]
const INT_COLORS = [
  { name: 'White',       hex: '#FFFFFF', border: true },
  { name: 'Light Grey',  hex: '#CFCCC9' },
  { name: 'Anthracite',  hex: '#2C2C2C' },
  { name: 'Natural Oak', hex: '#C4A97A' },
]
const HANDLES = ['Push-to-Open', 'Rail Noir', 'Barre Inox', 'T-Handle']
const FACADES = ['Oslo', 'Bergen']

type Color = { name: string; hex: string; border?: boolean }

type Props = {
  collName: string
  previewSrc: string
  labels: {
    price: string
    desc: string
    facade: string
    extColor: string
    intColor: string
    handle: string
    cta: string
  }
  ctaHref: string
}

export function StylerTeaser({ collName, previewSrc, labels, ctaHref }: Props) {
  const [selFacade, setSelFacade] = useState<string | null>(null)
  const [selExt,    setSelExt]    = useState<Color | null>(null)
  const [selInt,    setSelInt]    = useState<Color | null>(null)
  const [selHandle, setSelHandle] = useState<string | null>(null)

  const showExt    = selFacade !== null
  const showInt    = selExt !== null
  const showHandle = selInt !== null
  const showCta    = selHandle !== null
  const showCanvas = selExt !== null

  const parts = [
    collName.toUpperCase(),
    selFacade?.toUpperCase(),
    selExt?.name.toUpperCase(),
    selInt?.name.toUpperCase(),
    selHandle?.toUpperCase(),
  ].filter(Boolean) as string[]

  const summary = parts.join(' · ')

  const previewLabel = selFacade
    ? summary
    : `${collName.toUpperCase()} — CHOISISSEZ VOTRE FAÇADE`

  return (
    <div className="container">
    <div className="ms-grid">
      {/* ── LEFT ── */}
      <div className="ms-left">
        <header>
          <span className="re-tag">{labels.price}</span>
          <h2>
            {collName} Built-in System
          </h2>
          <p style={{ fontSize: '14px', color: '#000', maxWidth: '400px', lineHeight: 1.5, margin: 0 }}>
            {labels.desc}
          </p>
        </header>

        <div className="mc-steps-all">
          {/* FAÇADE */}
          <div className="mc-section">
            <h3 className="ms-mono" style={{ marginBottom: '12px' }}>{labels.facade}</h3>
            <div className="mc-chips">
              {FACADES.map(f => (
                <button
                  key={f} type="button"
                  className={`mc-chip${selFacade === f ? ' active' : ''}`}
                  onClick={() => { setSelFacade(f); setSelExt(null); setSelInt(null); setSelHandle(null) }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* COULEUR EXTÉRIEURE */}
          {showExt && (
            <div className="mc-section coll-slug-reveal">
              <h3 className="ms-mono" style={{ marginBottom: '12px' }}>{labels.extColor}</h3>
              <div className="es-color-chips">
                {EXT_COLORS.map(c => (
                  <button
                    key={c.hex} type="button"
                    className={`es-color-chip${selExt?.hex === c.hex ? ' active' : ''}`}
                    onClick={() => { setSelExt(c); setSelInt(null); setSelHandle(null) }}
                  >
                    <span className="es-color-dot" style={{ background: c.hex, ...(c.border ? { border: '1px solid rgba(0,0,0,0.1)' } : {}) }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* COULEUR INTÉRIEURE */}
          {showInt && (
            <div className="mc-section coll-slug-reveal">
              <h3 className="ms-mono" style={{ marginBottom: '12px' }}>{labels.intColor}</h3>
              <div className="es-color-chips">
                {INT_COLORS.map(c => (
                  <button
                    key={c.hex} type="button"
                    className={`es-color-chip${selInt?.hex === c.hex ? ' active' : ''}`}
                    onClick={() => { setSelInt(c); setSelHandle(null) }}
                  >
                    <span className="es-color-dot" style={{ background: c.hex, ...(c.border ? { border: '1px solid rgba(0,0,0,0.1)' } : {}) }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* POIGNÉE */}
          {showHandle && (
            <div className="mc-section coll-slug-reveal">
              <h3 className="ms-mono" style={{ marginBottom: '12px' }}>{labels.handle}</h3>
              <div className="mc-chips">
                {HANDLES.map(h => (
                  <button
                    key={h} type="button"
                    className={`mc-chip${selHandle === h ? ' active' : ''}`}
                    onClick={() => setSelHandle(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {showCta && (
            <div className="mc-section coll-slug-reveal" style={{ paddingTop: '16px' }}>
              <div className="product-cta">
                <Link href={ctaHref} className="btn-configure">{labels.cta}</Link>
                <span className="action-sep" />
                <button type="button" className="btn-add-product" aria-label="Ajouter">+</button>
              </div>
              <div style={{ fontFamily: '"PP Air Mono", monospace', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', marginTop: '8px' }}>
                {summary}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="ms-preview">
        <div className="coll-slug-styler-preview">
          {showCanvas ? (
            /* CSS color canvas */
            <>
              <div style={{ flex: 3, background: selExt!.hex, transition: 'background 300ms ease-out' }} />
              <div style={{ flex: 1, background: selInt?.hex ?? '#EEEDE7', borderTop: '2px solid rgba(0,0,0,0.08)', transition: 'background 300ms ease-out' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: '"PP Air Mono", monospace', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  {selExt!.name.toUpperCase()}
                </span>
                {selInt && (
                  <span style={{ fontFamily: '"PP Air Mono", monospace', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000' }}>
                    INT: {selInt.name.toUpperCase()}
                  </span>
                )}
              </div>
            </>
          ) : (
            <Image src={previewSrc} alt={`${collName} aperçu`} fill style={{ objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ fontFamily: '"PP Air Mono", monospace', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', marginTop: '8px', textAlign: 'center' }}>
          {previewLabel}
        </div>
      </div>
    </div>
    </div>
  )
}
