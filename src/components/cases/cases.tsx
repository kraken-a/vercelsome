// 'use client'
// import { useState } from 'react'
// import { useTranslations } from 'next-intl'
// import { Link } from '@/i18n/navigation'
// import './cases.css'
//
// const slides = [
//   {
//     img: '/images/cases/case-satori-hero.jpg',
//     textKey: 'testi_1_text',
//     authorKey: 'testi_1_author',
//     locationKey: 'testi_1_location',
//     collection: 'SATORI',
//     slug: '01',
//   },
//   {
//     img: '/images/cases/case-line-hero.jpg',
//     textKey: 'testi_2_text',
//     authorKey: 'testi_2_author',
//     locationKey: 'testi_2_location',
//     collection: 'LINE',
//     slug: '02',
//   },
//   {
//     img: '/images/cases/case-vista-hero.jpg',
//     textKey: 'testi_3_text',
//     authorKey: 'testi_3_author',
//     locationKey: 'testi_3_location',
//     collection: 'VISTA',
//     slug: '03',
//   },
// ]
//
// export default function Cases() {
//   const t = useTranslations('shop.collection')
//   const [current, setCurrent] = useState(0)
//
//   const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length)
//   const next = () => setCurrent((i) => (i + 1) % slides.length)
//
//   return (
//     <section style={{ padding: 'clamp(64px, 10vw, 120px) 0' }}>
//       <div className="container">
//         <div
//           style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'flex-end',
//             marginBottom: '32px',
//           }}
//         >
//           <div>
//             <span className="mono" style={{ color: 'var(--color-vert-persan, #0C524E)' }}>
//               {t('testi_h2')}
//             </span>
//             <h2
//               style={{
//                 fontSize: 'clamp(25px, 4vw, 39px)',
//                 letterSpacing: '-0.02em',
//                 marginTop: '8px',
//               }}
//             >
//               {t('testi_h2')}
//             </h2>
//           </div>
//           <div className="testi-nav">
//             <button className="testi-arrow" onClick={prev} aria-label={t('testi_counter', { current: current + 1, total: slides.length })}>
//               ←
//             </button>
//             <span className="testi-counter">
//               {current + 1} / {slides.length}
//             </span>
//             <button className="testi-arrow" onClick={next} aria-label={t('testi_counter', { current: current + 1, total: slides.length })}>
//               →
//             </button>
//           </div>
//         </div>
//
//         <div className="testi-slider">
//           {slides.map((slide, i) => (
//             <div key={i} className={`testi-slide${i === current ? ' active' : ''}`}>
//               {' '}
//               <div className="testi-img">
//                 <img src={slide.img} alt={t(slide.authorKey as 'testi_1_author')} loading="eager" />
//               </div>
//               <div className="testi-content">
//                 <span className="testi-quote">«</span>
//                 <p className="testi-text">{t(slide.textKey as 'testi_1_text')}</p>
//                 <div className="testi-author">
//                   <strong>{t(slide.authorKey as 'testi_1_author')}</strong>
//                   <span>{t(slide.locationKey as 'testi_1_location')}</span>
//                 </div>
//                 <div className="testi-meta">
//                   <span className="product-tag tag-collection">{slide.collection}</span>
//                   <Link href={{ pathname: '/etude-de-cas/[slug]', params: { slug: slide.slug } }} className="testi-link">
//                     {t('testi_see_project')}
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }
