import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { toImageProxyUrl } from '@/lib/image-url'
import '@/css/gamme-page.css'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.gammes', locale, pathMap: { fr: '/gamme', nl: '/gamma' } })
}

const STATIC_DATA_RAW: Record<string, {
  specKeys: string[]
  prix_depuis: number
  imageLeft: boolean
}> = {
  'dressing':       { specKeys: ['spec_custom', 'spec_4_collections', 'spec_open_closed', 'spec_installed'], prix_depuis: 890,  imageLeft: false },
  'bibliotheque':   { specKeys: ['spec_custom', 'spec_4_collections', 'spec_open_closed', 'spec_installed'], prix_depuis: 890,  imageLeft: true  },
  'meuble-tv':      { specKeys: ['spec_custom', 'spec_cable', 'spec_open_plus_closed', 'spec_floor_or_wall'],   prix_depuis: 1190, imageLeft: false },
  'ensemble-mural': { specKeys: ['spec_custom', 'spec_4_collections', 'spec_mix_open_closed', 'spec_installed'], prix_depuis: 1490, imageLeft: true },
  'commode':        { specKeys: ['spec_custom', 'spec_sliding_drawers', 'spec_brass_handles', 'spec_floor_or_wall'], prix_depuis: 690,  imageLeft: false },
  'buffet':         { specKeys: ['spec_custom', 'spec_hinged_doors', 'spec_integrated_drawers', 'spec_installed'], prix_depuis: 790, imageLeft: true },
}

export default async function GammesPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop.gamme' })
  const tDetail = await getTranslations({ locale, namespace: 'shop.gammeDetail' })
  const tShop = await getTranslations({ locale, namespace: 'shop' })

  const DEFAULT_SPEC_KEYS = ['spec_custom', 'spec_4_collections', 'spec_open_closed', 'spec_installed']

  const specTranslations: Record<string, string> = {
    spec_custom: tDetail('spec_custom'),
    spec_open_closed: tDetail('spec_open_closed'),
    spec_installed: tDetail('spec_installed'),
    spec_cable: tDetail('spec_cable'),
    spec_open_plus_closed: tDetail('spec_open_plus_closed'),
    spec_floor_or_wall: tDetail('spec_floor_or_wall'),
    spec_sliding_drawers: tDetail('spec_sliding_drawers'),
    spec_brass_handles: tDetail('spec_brass_handles'),
    spec_mix_open_closed: tDetail('spec_mix_open_closed'),
    spec_hinged_doors: tDetail('spec_hinged_doors'),
    spec_integrated_drawers: tDetail('spec_integrated_drawers'),
  }
  const [navResult, productsResult] = await Promise.all([
    getNavigation(),
    getProducts({ limit: '4', sort: 'popular' }),
  ])
  const types = navResult.success ? navResult.data.types : []
  const collections = navResult.success ? navResult.data.collections : []
  const products = productsResult.success ? productsResult.data.products : []

  const collectionCountByType: Record<string, number> = {}
  for (const col of collections) {
    const catSlugs = (col as { category_slugs?: string[] }).category_slugs ?? []
    for (const s of catSlugs) {
      collectionCountByType[s] = (collectionCountByType[s] ?? 0) + 1
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="gammes-page" style={{ paddingTop: '144px' }}>

      {/* Hero */}
      <div className="gammes-page-hero container">
        <p className="gammes-breadcrumb"><Link href="/">{tShop('breadcrumb_home')}</Link> › {t('breadcrumb_current')}</p>
        <h1>{t('h1')}</h1>
        <p>{t('intro')}<br />{t('intro_2')}</p>
      </div>

      {/* Tabs */}
      <div className="gammes-page-tabs-wrap">
        <div className="gammes-page-tabs">
          {types.map(type => (
            <a key={type.slug} href={`#${type.slug}`} className="gammes-page-tab">{type.name}</a>
          ))}
        </div>
      </div>

      {/* Gamme list */}
      <div className="gammes-page-list">
        {types.map((g, i) => {
          const image = toImageProxyUrl(g.image_url)
          const staticData = STATIC_DATA_RAW[g.slug]
          const colCount = collectionCountByType[g.slug] ?? 0
          const specKeys = staticData?.specKeys ?? DEFAULT_SPEC_KEYS
          const specs = specKeys.map(k =>
            (k === 'spec_4_collections') ? `${colCount} collection${colCount > 1 ? 's' : ''}` : (specTranslations[k] ?? k)
          )
          const prix = g.price_from && g.price_from > 0 ? g.price_from : 0
          const imageLeft = staticData?.imageLeft ?? (i % 2 !== 0)

          return i === 0 ? (
            /* First item — full-width banner with overlay */
            <div key={g.slug} id={g.slug} className="gamme-banner" style={{ marginBottom: '10rem' }}>
              {image && <Image src={image} alt={g.name} fill className="gamme-banner-img" style={{ objectFit: 'cover' }} />}
              <div className="gamme-banner-overlay" />
              <div className="gamme-banner-content">
                <span className="gamme-item-tag">{g.name.toUpperCase()}</span>
                <h2>{g.name}</h2>
                {g.category_desc && <p className="gamme-item-tagline">{g.category_desc}</p>}
                <div className="gamme-item-ctas">
                  <Link href={`/gamme/${g.slug}`} className="btn btn-primary">{t('btn_discover')}</Link>
                  <Link href="/configurer" className="btn btn-outline">{t('btn_configure')}</Link>
                </div>
              </div>
            </div>
          ) : (
            /* Other items — 50/50 grid */
            <div key={g.slug} id={g.slug} className={`gamme-item${imageLeft ? ' gamme-item--img-left' : ''}`}>
              <div className="gamme-item-img" style={{ position: 'relative', overflow: 'hidden' }}>
                {image && <Image src={image} alt={g.name} fill style={{ objectFit: 'cover' }} />}
              </div>
              <div className="gamme-item-body">
                <span className="gamme-item-tag-dark">{g.name.toUpperCase()}</span>
                <h2>{g.name}</h2>
                {g.category_desc && <p className="gamme-item-tagline-dark">{g.category_desc}</p>}
                <ul className="gamme-item-specs">
                  {specs.map((s, j) => <li key={j}>{s}</li>)}
                </ul>
                <p className="gamme-item-prix">
                  {t('price_from', { price: prix.toLocaleString('fr-BE') })}
                </p>
                <div className="gamme-item-ctas-dark">
                  <Link href={`/gamme/${g.slug}`} className="btn btn-primary">{t('btn_discover')}</Link>
                  <Link href="/configurer" className="btn btn-outline">{t('btn_configure')}</Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tableau comparatif */}
      <section className="gammes-compare-section container">
        <h2>{t('compare_h2')}</h2>
        <div className="gammes-compare-wrap">
          <table className="gammes-compare-table">
            <thead>
              <tr>
                <th>{t('compare_col_feature')}</th>
                <th>{t('compare_col_dressing')}</th>
                <th>{t('compare_col_bibliotheque')}</th>
                <th>{t('compare_col_meuble_tv')}</th>
                <th>{t('compare_col_entree')}</th>
                <th>{t('compare_col_placard')}</th>
                <th>{t('compare_col_pont')}</th>
              </tr>
            </thead>
            <tbody>
              {([
                [t('compare_row_custom'),            true,  true,  true,  true,  true,  true],
                [t('compare_row_portes_battantes'),   true,  true,  true,  true,  true,  true],
                [t('compare_row_portes_coulissantes'),true,  false, false, false, true,  false],
                [t('compare_row_etageres'),           true,  true,  true,  true,  false, true],
                [t('compare_row_tringle'),            true,  false, false, true,  false, true],
                [t('compare_row_tiroirs'),            true,  true,  true,  true,  true,  true],
                [t('compare_row_eclairage'),          true,  true,  true,  false, false, true],
                [t('compare_row_cables'),             false, false, true,  false, false, false],
              ] as [string, ...boolean[]][]).map(([label, ...vals]) => (
                <tr key={label}>
                  <td>{label}</td>
                  {(vals as boolean[]).map((v, i) => (
                    <td key={i}>{v ? <span className="gammes-check">✓</span> : <span className="gammes-dash">—</span>}</td>
                  ))}
                </tr>
              ))}
              <tr className="gammes-compare-prix-row">
                <td>{t('compare_row_price')}</td>
                <td><strong>1 890 €</strong></td>
                <td><strong>890 €</strong></td>
                <td><strong>1 190 €</strong></td>
                <td><strong>1 490 €</strong></td>
                <td><strong>1 290 €</strong></td>
                <td><strong>2 390 €</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4 icônes promesses */}
      <section className="gammes-promises container">
        {[
          { icon: '⬜', titleKey: 'promise_1_title' as const, descKey: 'promise_1_desc' as const },
          { icon: '🪴', titleKey: 'promise_2_title' as const, descKey: 'promise_2_desc' as const },
          { icon: '🔧', titleKey: 'promise_3_title' as const, descKey: 'promise_3_desc' as const },
          { icon: '★',  titleKey: 'promise_4_title' as const, descKey: 'promise_4_desc' as const },
        ].map(p => (
          <div key={p.titleKey} className="gammes-promise-item">
            <div className="gammes-promise-icon">{p.icon}</div>
            <h4>{t(p.titleKey)}</h4>
            <p>{t(p.descKey)}</p>
          </div>
        ))}
      </section>

      {/* CTA central */}
      <section className="gammes-cta-section">
        <h2>{t('cta_h2')}</h2>
        <p>{t('cta_p')}</p>
        <div className="gammes-cta-btns">
          <Link href="/configurer" className="btn btn-dark">{t('cta_configure')}</Link>
          <Link href="/contact" className="btn btn-outline">{t('cta_contact')}</Link>
        </div>
      </section>

      {/* Produits populaires */}
      <section className="gammes-popular container">
        <h2>{t('popular_h2')}</h2>
        <div className="gammes-popular-grid">
          {products.map(p => (
            <div key={p.id} className="gammes-popular-card">
              <div className="gammes-popular-img" style={{ position: 'relative', overflow: 'hidden' }}>
                <Image src={toImageProxyUrl(p.image_url)} alt={p.name} fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="gammes-popular-footer">
                <span className="gammes-popular-prix">{p.price_ttc.toLocaleString('fr-BE')} €</span>
                <Link href="/configurer" className="gammes-popular-configure">{t('popular_configure')}</Link>
              </div>
              <p className="gammes-popular-name">{p.name}</p>
            </div>
          ))}
        </div>
        <div className="gammes-popular-more">
          <Link href="/acheter" className="btn btn-outline" style={{ fontFamily: "'PP Air Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('popular_see_all')}</Link>
        </div>
      </section>

      {/* Inspirations */}
      <section className="gammes-inspo">
        <div className="container gammes-inspo-header">
          <div>
            <span className="gamme-item-tag-dark">{t('inspo_label')}</span>
            <h2>{t('inspo_h2')}</h2>
            <p>{t('inspo_p')}</p>
          </div>
          <Link href="/inspirations" className="btn btn-primary">{t('inspo_cta')}</Link>
        </div>
      </section>

      {/* Avis clients */}
      <section className="gammes-avis">
        <div className="container">
          <span className="gammes-avis-tag">{t('reviews_tag')}</span>
          <h2>{t('reviews_h2')}</h2>
          <div className="gammes-avis-grid">
            {[
              { initials: 'JD', role: t('role_owner'), city: t('city_antwerp') },
              { initials: 'LM', role: 'ARCHITECTE',   city: 'BRUXELLES' },
              { initials: 'AV', role: 'COLLECTIONNEUR', city: 'GAND' },
            ].map(a => (
              <div key={a.initials} className="gammes-avis-card">
                <div className="gammes-avis-quote">&quot;</div>
                <p>{t('reviews_placeholder')}</p>
                <div className="gammes-avis-author">
                  <div className="gammes-avis-avatar">{a.initials}</div>
                  <span>{a.role} — {a.city}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/configurer" className="gammes-avis-link">{t('reviews_pioneer')}</Link>
        </div>
      </section>

      {/* Stats bar */}
      <div className="gammes-stats-bar">
        {([
          { valueKey: 'stat_custom_value' as const,   labelKey: 'stat_custom_label' as const },
          { valueKey: 'stat_warranty_value' as const,  labelKey: 'stat_warranty_label' as const },
          { valueKey: 'stat_delivery_value' as const,  labelKey: 'stat_delivery_label' as const },
          { valueKey: 'stat_leadtime_value' as const,  labelKey: 'stat_leadtime_label' as const },
          { valueKey: 'stat_design_value' as const,    labelKey: 'stat_design_label' as const },
        ]).map(s => (
          <div key={s.labelKey} className="gammes-stat">
            <span className="gammes-stat-value">{t(s.valueKey)}</span>
            <span className="gammes-stat-label">{t(s.labelKey)}</span>
          </div>
        ))}
      </div>

    </main>
  )
}
