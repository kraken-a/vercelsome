'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'
import NextLink from 'next/link'
import './cgv.css'

export default function CGVPage() {
    const [openLegal, setOpenLegal] = useState<number | null>(0)

    const toggleLegal = (idx: number) => {
        setOpenLegal(prev => (prev === idx ? null : idx))
    }

    const t = useTranslations('legal.cgv_page')
    const breadcrumb = useTranslations('breadcrumb')

    const legalSections = [
        {key: 'art1', paragraphs: ['p1', 'p2']},
        {key: 'art2', paragraphs: ['p1', 'p2'], list: ['item1', 'item2', 'item3'], listAfter: ['p3']},
        {key: 'art3', paragraphs: ['p1', 'p2']},
        {key: 'art4', paragraphs: ['p1', 'p2']},
        {key: 'art5', paragraphs: ['p1', 'p2']},
        {key: 'art6', paragraphs: ['p1', 'p2']},
        {key: 'art7', paragraphs: ['p1', 'p2']},
        {key: 'art8', paragraphs: ['p2'], link: {before: 'art8_p1_before', label: 'art8_p1_link', href: '/cookies'}},
    ] as const

    return (
        <main>
            <div className="container">
                <div style={{padding: '1rem 0', fontSize: '0.9rem'}}>
                    <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('breadcrumb')}
                </div>
            </div>

            <section style={{paddingTop: '1rem'}}>
                <div className="container">
                    <div className="legal-content py-5 my-5 legal-acc">
                        <h1 style={{fontSize: '2.5rem', margin: '0.5rem 0'}}>{t('h1')}</h1>
                        <p className="updated">{t('updated')}</p>

                        <div className="legal-toc">
                            <h3>{t('toc_title')}</h3>
                            <div className="legal-acc">
                                {legalSections.map((section, idx) => (
                                    <div key={section.key} className="legal-section">
                                        <a
                                            href={`#${section.key}`}
                                            onClick={() => setOpenLegal(idx)}
                                        >
                                            {t(`toc_item${idx + 1}`)}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="legal-acc">
                            {legalSections.map((section, idx) => {
                                const isOpen = openLegal === idx
                                return (
                                    <div
                                        key={section.key}
                                        id={section.key}
                                        className={`legal-section${isOpen ? '' : ' collapsed'}`}
                                    >
                                        <h2
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={isOpen}
                                            onClick={() => toggleLegal(idx)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault()
                                                    toggleLegal(idx)
                                                }
                                            }}
                                        >
                                            {t(`${section.key}_title`)}
                                            <span className="legal-toggle" aria-hidden="true">
                        {isOpen ? '×' : '+'}
                    </span>
                                        </h2>
                                        <div className="legal-body">
                                            {section.paragraphs.map(p => (
                                                <p key={p}>{t(`${section.key}_${p}`)}</p>
                                            ))}

                                            {'list' in section && section.list && (
                                                <ul>
                                                    {section.list.map(item => (
                                                        <li key={item}>{t(`${section.key}_${item}`)}</li>
                                                    ))}
                                                </ul>
                                            )}

                                            {'listAfter' in section && section.listAfter?.map(p => (
                                                <p key={p}>{t(`${section.key}_${p}`)}</p>
                                            ))}

                                            {'link' in section && section.link && (
                                                <p>
                                                    {t(section.link.before)}{' '}
                                                    <NextLink href={section.link.href} style={{color: 'var(--teal)'}}>
                                                        {t(section.link.label)}
                                                    </NextLink>
                                                    .
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
