'use client'

import { useState } from 'react'

const TESTIMONIALS = [
  {
    id: 1,
    img: '/images/stock/oaksome-v8-dressing-vecu.jpg',
    text: '« Notre dressing sur mesure dépasse toutes nos attentes. Chaque centimètre est utilisé de façon intelligente, et la qualité de fabrication est vraiment remarquable. L&apos;équipe Oaksome nous a accompagnés du premier contact jusqu&apos;à la pose. »',
    name: 'Sophie & Thomas D.',
    location: 'Bruxelles, Belgique',
    case: 'Dressing — Collection Satori',
    caseLink: '/etudes-de-cas/dressing-satori-ixelles',
  },
  {
    id: 2,
    img: '/images/stock/oaksome-v8-biblio-chene.jpg',
    text: '« La bibliothèque occupe toute la hauteur de notre salon. Le résultat est époustouflant. On ne s&apos;attendait pas à une telle précision dans les finitions. Délai respecté, équipe professionnelle — que demander de plus ? »',
    name: 'Marc V.',
    location: 'Waterloo, Belgique',
    case: 'Bibliothèque — Collection Line',
    caseLink: '/etudes-de-cas/bibliotheque-line-waterloo',
  },
  {
    id: 3,
    img: '/images/stock/oaksome-v8-salon-satori.jpg',
    text: '« Après avoir visité plusieurs showrooms sans trouver ce qu&apos;on cherchait, Oaksome nous a permis de tout configurer en ligne et de visualiser le résultat. Le configurateur est vraiment bien pensé. »',
    name: 'Julie & Luc M.',
    location: 'Luxembourg-Ville',
    case: 'Meuble TV — Collection Vista',
    caseLink: '/etudes-de-cas/meuble-tv-vista-luxembourg',
  },
]

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent(c => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  const next = () => setCurrent(c => (c + 1) % TESTIMONIALS.length)

  const testi = TESTIMONIALS[current]

  return (
    <section>
      <div className="container">
        <div className="section-header">
          <span className="mono">Témoignages</span>
          <h2>Ils nous font confiance</h2>
        </div>

        <div className="testi-slider">
          <div className="testi-slide active">
            <div className="testi-img">
              <img src={testi.img} alt={testi.name} />
            </div>
            <div className="testi-content">
              <div className="testi-quote">&ldquo;</div>
              <p className="testi-text">{testi.text}</p>
              <div className="testi-author">
                <strong>{testi.name}</strong>
                <span>{testi.location}</span>
              </div>
              <div className="testi-meta">
                <a href={testi.caseLink} className="testi-link">
                  Voir l&apos;étude de cas →
                </a>
                <div className="testi-nav">
                  <button className="testi-arrow" onClick={prev} aria-label="Précédent">‹</button>
                  <span className="testi-counter">
                    {String(current + 1).padStart(2, '0')} / {String(TESTIMONIALS.length).padStart(2, '0')}
                  </span>
                  <button className="testi-arrow" onClick={next} aria-label="Suivant">›</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
