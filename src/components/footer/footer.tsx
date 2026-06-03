'use client'

/* import { useEffect, useState } from 'react';
 */
import './footer.css'

import { Link } from '@/i18n/navigation'

export default function Footer() {
  return (
    <>
      <div className="footer-stoemp">
        <div className="container">
          <div className="fs-topbar">
            <div className="fs-topbar-left">
              <span className="fs-label">Suivez-nous</span>
              <span className="fs-dash">&mdash;</span>
              <a href="https://instagram.com/oaksome_" target="_blank" rel="noopener">
                Instagram
              </a>
              <span className="fs-dot">.</span>
              <a href="https://facebook.com/oaksome" target="_blank" rel="noopener">
                Facebook
              </a>
              <span className="fs-dot">.</span>
              <a href="https://pinterest.com/oaksome" target="_blank" rel="noopener">
                Pinterest
              </a>
              <span className="fs-dot">.</span>
              <a href="https://tiktok.com/@oaksome" target="_blank" rel="noopener">
                TikTok
              </a>
            </div>
            <div className="fs-topbar-right">
              <a href="tel:+352261080077">+352 26 10 80 77</a>
              <span className="fs-dash">&mdash;</span>
              <a href="mailto:info@vercelsome.com">info@vercelsome.com</a>
            </div>
          </div>

          <div className="fs-line"></div>

          <div className="fs-columns">
            <div className="fs-col">
              <h4>EXPLORER</h4>
              <ul>
                <li><Link href="/acheter">Nos meubles</Link></li>
                <li><Link href="/collections">Collections</Link></li>
                <li><Link href="/configurer">Configurateur</Link></li>
                <li><Link href="/inspirations">Inspirations</Link></li>
                <li><Link href="/gamme">Mat&eacute;riaux</Link></li>
              </ul>
            </div>
            <div className="fs-col">
              <h4>AIDE</h4>
              <ul>
                <li>
                  <Link href="/comment-ca-marche">Comment &ccedil;a marche</Link>
                </li>
                <li>
                  <Link href="/echantillons">&Eacute;chantillons</Link>
                </li>
                <li>
                  <Link href="/prise-mesures">Prise de mesures</Link>
                </li>
                <li>
                  <Link href="/faq">FAQ</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="/livraison">Livraison &amp; pose</Link>
                </li>
                <li>
                  <Link href="/garantie">Garantie</Link>
                </li>
                <li>
                  <Link href="/return">Retours</Link>
                </li>
              </ul>
            </div>
            <div className="fs-col">
              <h4>ENTREPRISE</h4>
              <ul>
                <li>
                  <Link href="/a-propos">&Agrave; propos</Link>
                </li>
                <li>
                  <Link href="/engagements">Engagements</Link>
                </li>
                <li>
                  <Link href="/pro">Programme Pro</Link>
                </li>
                <li>
                  <Link href="/cgv">CGV</Link>
                </li>
                <li>
                  <Link href="/cookies">Confidentialit&eacute;</Link>
                </li>
                <li>
                  <Link href="/mentions-legales">Mentions l&eacute;gales</Link>
                </li>
              </ul>
            </div>
            <div className="fs-col">
              <h4>SERVICE CLIENT</h4>
              <ul>
                <li>Lun&ndash;ven 10h&ndash;22h CET</li>
                <li>Sam&ndash;dim 10h&ndash;18h CET</li>
                <li>
                  <Link href="/contact">Nous contacter</Link>
                </li>
                <li>
                  <a href="tel:+352261080077">+352 26 10 80 77</a>
                </li>
              </ul>
              <div className="fs-country-btns" style={{ marginTop: '16px' }}>
                <button className="fs-country-btn active">
                  <span className="fs-plus">+</span> Belgique
                </button>
                <button className="fs-country-btn">
                  <span className="fs-plus">+</span> Luxembourg
                </button>
              </div>
            </div>
          </div>

          <div className="fs-line"></div>

          <div className="fs-bottom">
            <div className="fs-watermark" aria-hidden="true">
              VERCELSOME
            </div>
            <div className="fs-bottom-right">
              <div className="fs-trustpilot">
                <div className="fs-trustpilot">
                  <img src="/images/trustpilot-logo.png" alt="Trustpilot" className="fs-tp-logo" />

                  <div className="fs-tp-stars">
                    <span className="fs-tp-star"></span>
                    <span className="fs-tp-star"></span>
                    <span className="fs-tp-star"></span>
                    <span className="fs-tp-star"></span>
                    <span className="fs-tp-star"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
