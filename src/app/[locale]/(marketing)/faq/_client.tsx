'use client'

import './faq.css'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Assurance from '@/components/assurance/assurance'

interface FaqItem {
  category: string
  question: string
  answer: React.ReactNode
  searchText: string
}

export default function FAQPage() {
  const t = useTranslations('faq')
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]))
  const categories = [
    { id: 'all', label: t('cat_all') },
    { id: 'orders', label: t('cat_orders') },
    { id: 'delivery', label: t('cat_delivery') },
    { id: 'configurator', label: t('cat_configurator') },
    { id: 'samples', label: t('cat_samples') },
    { id: 'returns', label: t('cat_returns') },
  ]
  const faqItems: FaqItem[] = [
    { category: 'configurator', question: t('q1_q'), answer: <p>{t('q1_a')}</p>, searchText: `${t('q1_q')} ${t('q1_a')}` },
    { category: 'delivery', question: t('q2_q'), answer: <p>{t('q2_a')}</p>, searchText: `${t('q2_q')} ${t('q2_a')}` },
    { category: 'orders', question: t('q3_q'), answer: <p>{t('q3_a')}</p>, searchText: `${t('q3_q')} ${t('q3_a')}` },
    {
      category: 'samples',
      question: t('q4_q'),
      answer: (
        <>
          <p>{t('q4_intro')}</p>
          <p><strong>{t('q4_b1_title')}</strong> {t('q4_b1_desc')}</p>
          <p><strong>{t('q4_b2_title')}</strong> {t('q4_b2_desc')}</p>
          <p><strong>{t('q4_b3_title')}</strong> {t('q4_b3_desc')}</p>
          <p>{t('q4_outro')}</p>
        </>
      ),
      searchText: `${t('q4_q')} ${t('q4_intro')} ${t('q4_b1_title')} ${t('q4_b1_desc')} ${t('q4_b2_title')} ${t('q4_b2_desc')} ${t('q4_b3_title')} ${t('q4_b3_desc')} ${t('q4_outro')}`,
    },
    { category: 'samples', question: t('q5_q'), answer: <p>{t('q5_a')}</p>, searchText: `${t('q5_q')} ${t('q5_a')}` },
    { category: 'delivery', question: t('q6_q'), answer: <p>{t('q6_a')}</p>, searchText: `${t('q6_q')} ${t('q6_a')}` },
    { category: 'orders', question: t('q7_q'), answer: <p>{t('q7_a')}</p>, searchText: `${t('q7_q')} ${t('q7_a')}` },
    { category: 'returns', question: t('q8_q'), answer: <p>{t('q8_a')}</p>, searchText: `${t('q8_q')} ${t('q8_a')}` },
    { category: 'delivery', question: t('q9_q'), answer: <p>{t('q9_a')}</p>, searchText: `${t('q9_q')} ${t('q9_a')}` },
    { category: 'orders', question: t('q10_q'), answer: <p>{t('q10_a')}</p>, searchText: `${t('q10_q')} ${t('q10_a')}` },
    { category: 'orders', question: t('q11_q'), answer: <p>{t('q11_a')}</p>, searchText: `${t('q11_q')} ${t('q11_a')}` },
  ]

  const filteredItems = faqItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    const q = search.toLowerCase()
    const matchesSearch =
      q === '' ||
      item.question.toLowerCase().includes(q) ||
      item.searchText.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <main>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{t('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_current')}
        </div>
      </div>

      <section style={{ paddingTop: '1rem' }}>
        <div className="container">
          <div className="section-header">
            <span className="mono" style={{ color: 'var(--primary)' }}>{t('mono_label')}</span>
            <h1>{t('h1')}</h1>
            <p>{t('intro')}</p>
          </div>

          <div className="faq-search">
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="faq-categories">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`faq-cat${activeCategory === cat.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="faq-list">
            {filteredItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem 0' }}>
                {t('no_results', { query: search })}
              </p>
            ) : (
              filteredItems.map((item, i) => {
                const isOpen = openItems.has(i)
                return (
                  <div
                    key={i}
                    className={`faq-item${isOpen ? ' open' : ''}`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="faq-question" onClick={() => toggleItem(i)}>
                      <h4>{item.question}</h4>
                      <span className="faq-toggle"></span>
                    </div>
                    <div className="faq-answer">{item.answer}</div>
                  </div>
                )
              })
            )}
          </div>

          <div className="faq-cta">
            <h3>{t('cta_title')}</h3>
            <p style={{ margin: '0.5rem 0 1.5rem' }}>{t('cta_intro')}</p>
            <Link href="/contact" className="btn btn-primary">{t('cta_contact')}</Link>
            <Link href="/rendez-vous" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>{t('cta_appointment')}</Link>
          </div>
        </div>
      </section>

      <Assurance />
    </main>
  )
}
