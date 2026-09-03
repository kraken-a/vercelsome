'use client'

import { toSlug } from '@/utils/string'

import { useEffect, useState } from 'react'
import './productSection.css'

export default function ProductSection() {
  const [products, setProducts] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    fetch('/api/odoo/product')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data)
      })
  }, [])

  return (
    <>
      <section>
        <div className="container">
          <div className="section-header">
            <span className="product_section_header">Nos meubles</span>
            <h2>Des meubles adaptés à votre espace exact.</h2>
            <p>Parcourez nos configurations populaires ou créez la vôtre de zéro.</p>
          </div>
          <div className="grid-4">
            {(
              products as {
                id: number
                name: string
                list_price: number
                currency_id?: [number, string]
                image_1920?: string
                image_1024?: string
                config_line_ids: Record<string, unknown>[]
                public_categ_ids?: { id: number; name: string }[]
                style_ids?: { id: number; name: string }[]
              }[]
            ).map((product) => {
              const slug = toSlug(product.name)
              const image = product.image_1920 || product.image_1024
              const allValues = (product.config_line_ids as Record<string, unknown>[])
                .flatMap((line) => line.allowed_value_ids as Record<string, unknown>[])
                .filter((v) => v.color_hex || v.value_image)
              const visibleValues = allValues.slice(0, 3)
              const extraValues = allValues.length - visibleValues.length

              return (
                <div key={product.id} className="product-card">
                  <div className="product-img">
                    <button className="wishlist-btn">♡</button>
                    {image && <img src={`data:image/png;base64,${image}`} alt={product.name} />}
                  </div>
                  <div className="product-info">
                    <p className="price">
                      À partir {product.list_price} {product.currency_id?.[1]}
                    </p>
                    <h4>{product.name}</h4>
                    <div className="product-tags">
                      {(
                        product.public_categ_ids as { id: number; name: string }[] | undefined
                      )?.map((c) => (
                        <span key={c.id} className="product-tag">
                          {c.name}
                        </span>
                      ))}
                      {(product.style_ids as { id: number; name: string }[] | undefined)?.map(
                        (s) => (
                          <span key={s.id} className="product-tag tag-collection">
                            {s.name}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="product-footer">
                    <div className="color-dots">
                      {(
                        visibleValues as {
                          id: number
                          name: string
                          color_hex?: string
                          value_image?: string
                        }[]
                      ).map((v) =>
                        v.color_hex ? (
                          <span
                            key={v.id}
                            className="color-dot"
                            style={{ background: v.color_hex }}
                            title={v.name}
                          ></span>
                        ) : (
                          <img
                            key={v.id}
                            className="color-dot"
                            src={`data:image/png;base64,${v.value_image}`}
                            title={v.name}
                            alt={v.name}
                          />
                        ),
                      )}
                      {extraValues > 0 && <span className="color-more">+{extraValues}</span>}
                    </div>
                    <a href={`/configurateur/${slug}`} className="btn-configure">
                      Configurer
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '2.5rem' }}
          >
            <a
              href="acheter.html"
              className="btn btn-secondary"
              style={{
                whiteSpace: 'nowrap',
                fontFamily: "'PP Air Mono',monospace",
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.6rem 1.2rem',
                border: '1px solid var(--dark)',
                background: 'none',
                color: 'var(--dark)',
                textDecoration: 'none',
              }}
            >
              Tous les meubles →
            </a>
            <div
              style={{ flex: 1, borderTop: '1px solid var(--dark)', marginLeft: '0.5rem' }}
            ></div>
          </div>
        </div>
      </section>
    </>
  )
}
