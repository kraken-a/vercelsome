'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'

type FooterCountrySelectorProps = {
  countryBelgium: string
  countryLuxembourg: string
  labelCountry: string
}

type CountryCode = 'be' | 'lu'

export function FooterCountrySelector({
  countryBelgium,
  countryLuxembourg,
  labelCountry,
}: FooterCountrySelectorProps) {
  const [openCountry, setOpenCountry] = useState<CountryCode | null>(null)
  const locale = useLocale()

  function navigateToLanguage(target: 'fr' | 'nl' | 'en') {
    if (typeof window === 'undefined') return
    const { pathname, search, hash } = window.location
    const nextPathname = pathname.replace(/^\/(fr|nl|en)(?=\/|$)/, `/${target}`)
    window.location.assign(`${nextPathname}${search}${hash}`)
  }

  function toggle(country: CountryCode) {
    setOpenCountry((current) => (current === country ? null : country))
  }

  return (
    <div className="fs-country-btns" aria-label={labelCountry}>
      <div className="fs-country-group">
        <button
          type="button"
          className={`fs-country-btn ${openCountry === 'be' ? 'active' : ''}`}
          aria-expanded={openCountry === 'be'}
          aria-controls="footer-country-be-languages"
          onClick={() => toggle('be')}
        >
          <span className="fs-plus">+</span> {countryBelgium}
        </button>
        <div
          id="footer-country-be-languages"
          className={`fs-language-panel ${openCountry === 'be' ? 'open' : ''}`}
        >
          <button
            type="button"
            className={`fs-language-link ${locale === 'fr' ? 'active' : ''}`}
            onClick={() => navigateToLanguage('fr')}
          >
            FR
          </button>
          <button
            type="button"
            className={`fs-language-link ${locale === 'nl' ? 'active' : ''}`}
            onClick={() => navigateToLanguage('nl')}
          >
            NL
          </button>
          <button type="button" className={`fs-language-link ${locale === 'en' ? 'active' : ''}`} onClick={() => navigateToLanguage('en')}>
            EN
          </button>
        </div>
      </div>

      <div className="fs-country-group">
        <button
          type="button"
          className={`fs-country-btn ${openCountry === 'lu' ? 'active' : ''}`}
          aria-expanded={openCountry === 'lu'}
          aria-controls="footer-country-lu-languages"
          onClick={() => toggle('lu')}
        >
          <span className="fs-plus">+</span> {countryLuxembourg}
        </button>
        <div
          id="footer-country-lu-languages"
          className={`fs-language-panel ${openCountry === 'lu' ? 'open' : ''}`}
        >
          <button
            type="button"
            className={`fs-language-link ${locale === 'fr' ? 'active' : ''}`}
            onClick={() => navigateToLanguage('fr')}
          >
            FR
          </button>
          <button type="button" className={`fs-language-link ${locale === 'en' ? 'active' : ''}`} onClick={() => navigateToLanguage('en')}>
            EN
          </button>
        </div>
      </div>
    </div>
  )
}
