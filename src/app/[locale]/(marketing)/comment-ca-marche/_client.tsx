'use client'

import './howitworks.css'
import Script from 'next/script'
import {useEffect} from 'react'
import { useTranslations } from 'next-intl'

import {Link} from '@/i18n/navigation'
import Assurance from "@/components/assurance/assurance";


export default function CommentCaMarchePage() {
    const t = useTranslations('about')
    const breadcrumb = useTranslations('breadcrumb')

    function closeMobileMenu() {
        document.getElementById('mobileMenu')?.classList.remove('open')
        document.getElementById('mobileMenuOverlay')?.classList.remove('open')
    }

    function closeNotifPanel() {
        document.getElementById('notifPanel')?.classList.remove('open')
        document.getElementById('notifOverlay')?.classList.remove('open')
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeMobileMenu()
                closeNotifPanel()
            }
        }
        const handleMobileLinks = () => {
            document.querySelectorAll('.mobile-menu a').forEach((link) => {
                link.addEventListener('click', closeMobileMenu)
            })
        }
        document.addEventListener('keydown', handleKeyDown)
        handleMobileLinks()
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <>

            <div className="breadcrumb">
                <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('ccm_breadcrumb_label')}
            </div>


            {/*<div className="promo-bar-v2">*/}
            {/*    <span>Offre de lancement — Conditions privilégiées sur une sélection de meubles</span>*/}
            {/*    <Link href="/contact">En savoir plus</Link>*/}
            {/*</div>*/}


            <section className="ccm-hero">
                <img src="/images/stock/oaksome-v8-ambiance-satori-1.jpg"
                     alt={t('ccm_hero_img_alt')}/>
                <div className="ccm-hero-overlay"></div>
                <div className="ccm-hero-content">
                    <h1>{t('ccm_hero_h1')}</h1>
                    <p>{t('ccm_hero_p')}</p>
                </div>
            </section>

            <section className="ccm-step" style={{background: 'var(--color-beige-clair)'}}>
                <div className="ccm-step-grid">
                    <div className="ccm-step-img">
                        <img src="/images/stock/oaksome-v8-config-module.jpg"
                             alt={t('ccm_step1_img_alt')}/>
                    </div>
                    <div className="ccm-step-text">
                        <span className="ccm-step-number">01</span>
                        <div className="ccm-step-inner">
                            <span className="ccm-step-label">{t('ccm_step1_label')}</span>
                            <h2>{t('ccm_step1_h2')}</h2>
                            <p>{t('ccm_step1_p')}</p>
                            <ul className="ccm-bullets">
                                <li>{t('ccm_step1_li1')}</li>
                                <li>{t('ccm_step1_li2')}</li>
                                <li>{t('ccm_step1_li3')}</li>
                            </ul>
                            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px'}}>
                                <Link href="/configurer" className="ccm-cta" style={{margin: 0}}>{t('ccm_step1_cta_launch')}</Link>
                                <Link
                                    href="/echantillons"
                                    className="ccm-cta"
                                    style={{
                                        margin: 0,
                                        background: 'transparent',
                                        color: 'var(--color-vert-persan, #0C524E)',
                                        border: '1px solid var(--color-vert-persan, #0C524E)'
                                    }}
                                >
                                    {t('ccm_step1_cta_samples')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="reassurance-editorial" style={{padding: '64px 0'}}>
                <div className="container">
                    <div className="section-header" style={{marginBottom: '32px'}}>
                        <span className="mono"
                              style={{color: 'var(--color-vert-persan, #0C524E)'}}>{t('ccm_re_tag')}</span>
                        <h2>{t('ccm_re_h2')}</h2>
                        <p>{t('ccm_re_p')}</p>
                    </div>
                    <div className="re-grid">
                        <Link href="/echantillons" className="re-card">
                            <div className="re-card-photo"><img src="/images/reassurance-online.png" alt={t('ccm_re_online_img_alt')}
                                                                loading="lazy"/></div>
                            <div className="re-card-body">
                                <span className="re-tag">{t('ccm_re_online_tag')}</span>
                                <h3>{t('ccm_re_online_h3')}</h3>
                                <p>{t('ccm_re_online_p')}</p>
                            </div>
                        </Link>
                        <Link href="/echantillons" className="re-card re-card--highlight">
                            <div className="re-card-photo"><img src="/images/reassurance-samples.png"
                                                                alt={t('ccm_re_samples_img_alt')} loading="lazy"/></div>
                            <div className="re-card-body">
                                <span className="re-tag re-tag--accent">{t('ccm_re_samples_tag')}</span>
                                <h3>{t('ccm_re_samples_h3')}</h3>
                                <p>{t('ccm_re_samples_p')}</p>
                            </div>
                        </Link>
                        <Link href="/echantillons" className="re-card">
                            <div className="re-card-photo"><img src="/images/reassurance-kit.png" alt={t('ccm_re_kit_img_alt')}
                                                                loading="lazy"/></div>
                            <div className="re-card-body">
                                <span className="re-tag">{t('ccm_re_kit_tag')}</span>
                                <h3>{t('ccm_re_kit_h3')}</h3>
                                <p>{t('ccm_re_kit_p')}</p>
                            </div>
                        </Link>
                        <Link href="/echantillons" className="re-card">
                            <div className="re-card-photo"><img src="/images/reassurance-showroom.png"
                                                                alt={t('ccm_re_showroom_img_alt')} loading="lazy"/></div>
                            <div className="re-card-body">
                                <span className="re-tag">{t('ccm_re_showroom_tag')}</span>
                                <h3>{t('ccm_re_showroom_h3')}</h3>
                                <p>{t('ccm_re_showroom_p')}</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="ccm-step reverse" style={{background: 'var(--color-beige)'}}>
                <div className="ccm-step-grid">
                    <div className="ccm-step-text">
                        <span className="ccm-step-number">02</span>
                        <div className="ccm-step-inner">
                            <span className="ccm-step-label">{t('ccm_step2_label')}</span>
                            <h2>{t('ccm_step2_h2')}</h2>
                            <p>{t('ccm_step2_p')}</p>
                            <ul className="ccm-bullets">
                                <li>{t('ccm_step2_li1')}</li>
                                <li>{t('ccm_step2_li2')}</li>
                                <li>{t('ccm_step2_li3')}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="ccm-step-img">
                        <img src="/images/stock/oaksome-v8-config-prix.jpg"
                             alt={t('ccm_step2_img_alt')}/>
                    </div>
                </div>
            </section>

            <section className="ccm-step" style={{background: 'var(--color-beige-clair)'}}>
                <div className="ccm-step-grid">
                    <div className="ccm-step-img">
                        <img src="/images/stock/oaksome-v8-about-equipe.jpg"
                             alt={t('ccm_step3_img_alt')}/>
                    </div>
                    <div className="ccm-step-text">
                        <span className="ccm-step-number">03</span>
                        <div className="ccm-step-inner">
                            <span className="ccm-step-label">{t('ccm_step3_label')}</span>
                            <h2>{t('ccm_step3_h2')}</h2>
                            <p>{t('ccm_step3_p')}</p>
                            <ul className="ccm-bullets">
                                <li>{t('ccm_step3_li1')}</li>
                                <li>{t('ccm_step3_li2')}</li>
                                <li>{t('ccm_step3_li3')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="ccm-step reverse" style={{background: 'var(--color-beige)'}}>
                <div className="ccm-step-grid">
                    <div className="ccm-step-text">
                        <span className="ccm-step-number">04</span>
                        <div className="ccm-step-inner">
                            <span className="ccm-step-label">{t('ccm_step4_label')}</span>
                            <h2>{t('ccm_step4_h2')}</h2>
                            <p>{t('ccm_step4_p')}</p>
                            <ul className="ccm-bullets">
                                <li>{t('ccm_step4_li1')}</li>
                                <li>{t('ccm_step4_li2')}</li>
                                <li>{t('ccm_step4_li3')}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="ccm-step-img">
                        <img src="/images/stock/oaksome-v8-about-atelier.jpg"
                             alt={t('ccm_step4_img_alt')}/>
                    </div>
                </div>
            </section>

            <section className="ccm-prix">
                <div className="ccm-prix-container">
                    <div className="ccm-prix-header">
                        <span className="mono" style={{color: 'var(--color-vert-persan)'}}>{t('ccm_prix_tag')}</span>
                        <h2>{t('ccm_prix_h2')}</h2>
                    </div>
                    <div className="ccm-prix-grid">
                        <div className="ccm-prix-col">
                            <h3>{t('ccm_prix_1_h3')}</h3>
                            <p>{t('ccm_prix_1_p')}</p>
                        </div>
                        <div className="ccm-prix-col">
                            <h3>{t('ccm_prix_2_h3')}</h3>
                            <p>{t('ccm_prix_2_p')}</p>
                        </div>
                        <div className="ccm-prix-col">
                            <h3>{t('ccm_prix_3_h3')}</h3>
                            <p>{t('ccm_prix_3_p')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="ccm-band">
                <h2>{t('ccm_band_h2')}</h2>
                <Link href="/configurer" className="ccm-band-cta">{t('ccm_band_cta')}</Link>
            </section>

            <Assurance/>

            <Script src="/js/nav-scroll.js" strategy="afterInteractive"/>
        </>
    )
}
