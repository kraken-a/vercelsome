import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { FooterCountrySelector } from './footer-country-selector'
import './footer.css'

export async function Footer() {
  const t = await getTranslations()
  return (
    <footer className="footer-stoemp">
      <div className="container">
        {/* Row 1 — Social bar + Contact */}
        <div className="fs-topbar">
          <div className="fs-topbar-left">
            <span className="fs-label">{t('footer.follow_us')}</span>
            <span className="fs-dash">—</span>
            <a href="https://instagram.com/oaksome_" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span className="fs-dot">.</span>
            <a href="https://facebook.com/oaksome" target="_blank" rel="noopener noreferrer">Facebook</a>
            <span className="fs-dot">.</span>
            <a href="https://pinterest.com/oaksome" target="_blank" rel="noopener noreferrer">Pinterest</a>
            <span className="fs-dot">.</span>
            <a href="https://tiktok.com/@oaksome" target="_blank" rel="noopener noreferrer">TikTok</a>
          </div>
          <div className="fs-topbar-right">
            <a href="tel:+352261080077">+352 26 10 80 77</a>
            <span className="fs-dash">—</span>
            <a href="mailto:info@vercelsome.com">info@vercelsome.com</a>
          </div>
        </div>

        {/* Separator line */}
        <div className="fs-line" />

        {/* Row 2 — 4 columns */}
        <nav aria-label={t('footer.nav_label')} className="fs-columns">
          {/* Col 1 — Explorer */}
          <div className="fs-col">
            <h4>{t('footer.explore')}</h4>
            <ul>
              <li><Link href="/acheter">{t('nav.our_furniture')}</Link></li>
              <li><Link href="/collections">{t('nav.collections')}</Link></li>
              <li><Link href="/configurer">{t('nav.configurator')}</Link></li>
              <li><Link href="/inspirations">{t('nav.inspirations')}</Link></li>
              <li><Link href="/gamme">{t('footer.materials')}</Link></li>
            </ul>
          </div>

          {/* Col 2 — Aide */}
          <div className="fs-col">
            <h4>{t('footer.col_help')}</h4>
            <ul>
              <li><Link href="/comment-ca-marche">{t('nav.how_it_works')}</Link></li>
              <li><Link href="/echantillons">{t('nav.samples')}</Link></li>
              <li><Link href="/prise-mesures">{t('legal.prise_mesures')}</Link></li>
              <li><Link href="/faq">{t('footer.faq')}</Link></li>
              <li><Link href="/contact">{t('nav.contact')}</Link></li>
              <li><Link href="/livraison">{t('footer.delivery_pose')}</Link></li>
              <li><Link href="/garantie">{t('legal.garantie')}</Link></li>
              <li><Link href="/return">{t('footer.returns')}</Link></li>
            </ul>
          </div>

          {/* Col 3 — Entreprise */}
          <div className="fs-col">
            <h4>{t('footer.col_company')}</h4>
            <ul>
              <li><Link href="/a-propos">{t('footer.about')}</Link></li>
              <li><Link href="/engagements">{t('footer.engagements')}</Link></li>
              <li><Link href="/pro">{t('footer.pro_program')}</Link></li>
              <li><Link href="/cgv">{t('footer.cgv')}</Link></li>
              <li><Link href="/cookies">{t('footer.privacy')}</Link></li>
              <li><Link href="/mentions-legales">{t('legal.mentions_legales')}</Link></li>
            </ul>
          </div>

          {/* Col 4 — Service client */}
          <div className="fs-col">
            <h4>{t('footer.col_customer')}</h4>
            <ul>
              <li>{t('footer.hours_weekdays')}</li>
              <li>{t('footer.hours_weekend')}</li>
              <li><Link href="/contact">{t('footer.contact_us')}</Link></li>
              <li><a href="tel:+352261080077">+352 26 10 80 77</a></li>
            </ul>
            <div style={{ marginTop: '16px' }}>
              <FooterCountrySelector
                labelCountry={t('footer.label_country')}
                countryBelgium={t('footer.country_be')}
                countryLuxembourg={t('footer.country_lu')}
              />
            </div>
          </div>
        </nav>

        {/* Separator line */}
        <div className="fs-line" />

        {/* Row 3 — Watermark bottom */}
        <div className="fs-bottom">
          <Image src="/images/oaksome-watermark.svg" alt="" aria-hidden="true" className="fs-watermark-svg" width={1623} height={100} unoptimized />
          <div className="fs-bottom-right">
            <Image src="/images/trustpilot-widget.svg" alt="Trustpilot" className="fs-trustpilot-svg" width={120} height={24} unoptimized />
          </div>
        </div>
      </div>
    </footer>
  )
}
