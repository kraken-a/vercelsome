'use client';

import { toSlug } from "@/utils/string";
import { useState, useEffect } from 'react';
import './header.css';

import { Link } from '@/i18n/navigation'

export interface OdooItem {
    id: number;
    name: string;
    image_128?: string;
    image?: string;
}

const STATIC_SEARCH_ENTRIES = [
    { term: 'garantie', url: 'garantie.html', label: 'Garantie', type: 'Info' },
    { term: 'livraison', url: 'livraison.html', label: 'Livraison & pose', type: 'Info' },
    { term: 'faq', url: 'faq.html', label: 'FAQ', type: 'Info' },
    { term: 'contact', url: 'contact.html', label: 'Contact', type: 'Info' },
    { term: 'matériaux', url: 'materiaux.html', label: 'Matériaux', type: 'Info' },
    { term: 'configurateur', url: 'configurer.html', label: 'Configurateur', type: 'Outil' },
    { term: 'échantillons', url: 'echantillons.html', label: 'Échantillons', type: 'Info' },
    { term: 'tva', url: 'tva-6.html', label: 'TVA 6% rénovation', type: 'Info' },
    { term: 'délai', url: 'faq.html', label: 'Délai de fabrication', type: 'FAQ' },
    { term: 'prix', url: 'acheter.html', label: 'Nos prix', type: 'Info' },
    { term: 'mesure', url: 'prises-de-mesures.html', label: 'Prise de mesures', type: 'Info' },
];

function normalize(str: string) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function imageSrc(value?: string): string {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    return `data:image/png;base64,${value}`;
}


export default function Header() {
    const [categories, setCategories] = useState<OdooItem[]>([]);
    const [spaces, setSpaces] = useState<OdooItem[]>([]);
    const [styles, setStyles] = useState<OdooItem[]>([]);

    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifPanelOpen, setNotifPanelOpen] = useState(false);
    const [helpChatOpen, setHelpChatOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/odoo/categories').then(r => r.json()).then(data => { if (Array.isArray(data)) setCategories(data); });
        fetch('/api/odoo/spaces').then(r => r.json()).then(data => { if (Array.isArray(data)) setSpaces(data); });
        fetch('/api/odoo/styles').then(r => r.json()).then(data => { if (Array.isArray(data)) setStyles(data); });
    }, []);

    const searchIndex = [
        ...categories.map((c) => ({ term: normalize(c.name), label: c.name, url: `gamme-${toSlug(c.name)}.html`, type: 'Type' })),
        ...spaces.map((s) => ({ term: normalize(s.name), label: s.name, url: `espace-${toSlug(s.name)}.html`, type: 'Pièce' })),
        ...styles.map((s) => ({ term: normalize(s.name), label: s.name, url: `collection-${toSlug(s.name)}.html`, type: 'Collection' })),
        ...STATIC_SEARCH_ENTRIES,
    ];

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setMobileMenuOpen(false);
                setNotifPanelOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, []);

    const searchResults = searchQuery.length >= 2
        ? searchIndex.filter(item =>
            item.term.includes(normalize(searchQuery)) ||
            normalize(item.label).includes(normalize(searchQuery))
        )
        : [];

    const BELL_BADGE = 3;

    return (
        <>
            <div className="promo-bar-v2">
                <span>Offre de lancement — Conditions privilégiées sur une sélection de meubles</span>
                <a href="contact.html">En savoir plus</a>
            </div>

            <nav>
                <button className="nav-hamburger" onClick={() => setMobileMenuOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                <div className="nav-left">
                    <a href="acheter.html" style={{ fontWeight: 600 }}>Nos meubles</a>

                    <div className="nav-dropdown">
                        <a href="gamme.html" className="nav-dropdown-link">Par Type ▾</a>
                        <div className="nav-dropdown-menu nav-mega">
                            <div className="mega-sections">
                                <div className="mega-section-left">
                                    <a className="mega-path">
                                        <span className="mega-path-title">Tous les types</span>
                                        <span className="mega-path-desc">Parcourez notre catalogue par type de meuble</span>
                                        <span className="mega-path-link">Voir tous les types →</span>
                                    </a>
                                </div>
                                <div className="mega-section-right">
                                    <div className="mega-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                                        {categories.map((cat) => {
                                            const slug = toSlug(cat.name);
                                            return (
                                                <a key={cat.id} href={`gamme-${slug}.html`} className="mega-item">
                                                    {cat.image_128 && <img src={imageSrc(cat.image_128)} alt={cat.name} />}
                                                    <span>{cat.name}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="nav-dropdown">
                        <a className="nav-dropdown-link">Par Pièce ▾</a>
                        <div className="nav-dropdown-menu nav-mega">
                            <div className="mega-sections">
                                <div className="mega-section-left">
                                    <a href="espaces.html" className="mega-path">
                                        <span className="mega-path-title">Toutes les pièces</span>
                                        <span className="mega-path-desc">Explorez nos solutions par espace de vie</span>
                                        <span className="mega-path-link">Voir toutes les pièces →</span>
                                    </a>
                                </div>
                                <div className="mega-section-right">
                                    <div className="mega-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                                        {spaces.map((space) => {
                                            const slug = toSlug(space.name);
                                            return (
                                                <a key={space.id} href={`espace-${slug}.html`} className="mega-item">
                                                    {space.image && <img src={imageSrc(space.image)} alt={space.name} />}
                                                    <span>{space.name}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="nav-dropdown">
                        <a href="collections.html" className="nav-dropdown-link">Collections ▾</a>
                        <div className="nav-dropdown-menu nav-mega">
                            <div className="mega-sections">
                                <div className="mega-section-left">
                                    <a href="collections.html" className="mega-path">
                                        <span className="mega-path-title">Toutes les collections</span>
                                        <span className="mega-path-desc">Quatre univers esthétiques complets.</span>
                                        <span className="mega-path-link">Comparer les collections →</span>
                                    </a>
                                </div>
                                <div className="mega-section-right">
                                    <div className="mega-grid" style={{ gridTemplateColumns: `repeat(${Math.min(styles.length, 4)}, 1fr)` }}>
                                        {styles.map((style) => {
                                            const slug = toSlug(style.name);
                                            return (
                                                <a key={style.id} href={`collection-${slug}.html`} className="mega-item">
                                                    {style.image && <img src={imageSrc(style.image)} alt={style.name} />}
                                                    <span>{style.name}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Link href="/" className="logo">
                    <img src="/images/oaksome-logo.svg" alt="Vercelsome" style={{ height: '20px', width: 'auto' }} />
                </Link>

                <div className="nav-right">
                    <Link href="/inspirations">Inspiration</Link>
                    <Link href="/comment-ca-marche">Comment ça marche</Link>
                    <a href="configurer.html" className="nav-cta-link">Configurateur</a>
                    <span className="nav-icon search-icon" title="Rechercher" onClick={() => setSearchOpen(true)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    <a href="mon-espace.html" className="nav-icon" title="Mon compte">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                    </a>
                    <span className="nav-icon nav-bell" title="Notifications" onClick={() => setNotifPanelOpen(true)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="bell-badge">{BELL_BADGE}</span>
                    </span>
                    <Link href="/wishlist" className="nav-wishlist" title="Wishlist">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </Link>
                    <Link href="/panier" className="nav-cart">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                    </Link>
                </div>
            </nav>

            <div
                className={`search-overlay${searchOpen ? ' open' : ''}`}
                onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
            >
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher un meuble, une collection, un espace..."
                        autoFocus={searchOpen}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="search-results">
                        {searchResults.map((item, i) => (
                            <a key={i} href={item.url}>
                                <span className="search-label">{item.label}</span>
                                <span className="search-type">{item.type}</span>
                            </a>
                        ))}
                        {searchQuery.length >= 2 && searchResults.length === 0 && (
                            <div className="search-no-result">
                                Aucun résultat pour &ldquo;{searchQuery}&rdquo;.<br />
                                <a href="contact.html">Contactez-nous</a>, on vous aide.
                            </div>
                        )}
                    </div>
                    {searchQuery.length < 2 && (
                        <p className="search-hint">Essayez : dressing, bibliothèque, Satori, chambre...</p>
                    )}
                </div>
            </div>

            <div
                className={`mobile-menu-overlay${mobileMenuOpen ? ' open' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            />
            <div className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
                <div className="mobile-menu-header">
                    <img src="/images/oaksome-logo.svg" alt="Vercelsome" style={{ height: '18px' }} />
                    <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>&times;</button>
                </div>
                <div className="mobile-menu-body">
                    <a href="acheter.html" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Nos meubles</a>

                    {/* Par Type accordion — dynamic */}
                    <div className={`mobile-menu-accordion${openAccordion === 'type' ? ' open' : ''}`}>
                        <button
                            className="mobile-menu-accordion-toggle"
                            onClick={() => setOpenAccordion(openAccordion === 'type' ? null : 'type')}
                        >
                            Par Type <span className="acc-arrow">▾</span>
                        </button>
                        <div className="mobile-menu-accordion-content">
                            <div className="mobile-menu-sub-grid">
                                {categories.map((cat) => {
                                    const slug = toSlug(cat.name);
                                    return (
                                        <a key={cat.id} href={`gamme-${slug}.html`} className="mobile-menu-sub-item">
                                            {cat.image_128 && <img src={imageSrc(cat.image_128)} alt={cat.name} />}
                                            <span>{cat.name}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Par Pièce accordion — dynamic */}
                    <div className={`mobile-menu-accordion${openAccordion === 'piece' ? ' open' : ''}`}>
                        <button
                            className="mobile-menu-accordion-toggle"
                            onClick={() => setOpenAccordion(openAccordion === 'piece' ? null : 'piece')}
                        >
                            Par Pièce <span className="acc-arrow">▾</span>
                        </button>
                        <div className="mobile-menu-accordion-content">
                            <div className="mobile-menu-sub-grid">
                                {spaces.map((space) => {
                                    const slug = toSlug(space.name);
                                    return (
                                        <a key={space.id} href={`espace-${slug}.html`} className="mobile-menu-sub-item">
                                            {space.image_128 && <img src={imageSrc(space.image_128)} alt={space.name} />}
                                            <span>{space.name}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className={`mobile-menu-accordion${openAccordion === 'collections' ? ' open' : ''}`}>
                        <button
                            className="mobile-menu-accordion-toggle"
                            onClick={() => setOpenAccordion(openAccordion === 'collections' ? null : 'collections')}
                        >
                            Collections <span className="acc-arrow">▾</span>
                        </button>
                        <div className="mobile-menu-accordion-content">
                            <div className="mobile-menu-sub-list">
                                {styles.map((style) => {
                                    const slug = toSlug(style.name);
                                    return (
                                        <a key={style.id} href={`collection-${slug}.html`}>
                                            {style.name}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <Link href="/inspirations" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Inspiration</Link>
                    <Link href="/comment-ca-marche" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</Link>
                    <a href="configurer.html" className="mobile-menu-link mobile-menu-cta" onClick={() => setMobileMenuOpen(false)}>Configurateur →</a>
                    <div className="mobile-menu-divider"></div>
                    <a href="echantillons.html" className="mobile-menu-link-sm" onClick={() => setMobileMenuOpen(false)}>Échantillons</a>
                    <a href="faq.html" className="mobile-menu-link-sm" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                    <a href="contact.html" className="mobile-menu-link-sm" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                    <a href="a-propos.html" className="mobile-menu-link-sm" onClick={() => setMobileMenuOpen(false)}>À propos</a>
                </div>
            </div>

            <div
                className={`notif-overlay${notifPanelOpen ? ' open' : ''}`}
                onClick={() => setNotifPanelOpen(false)}
            />
            <div className={`notif-panel${notifPanelOpen ? ' open' : ''}`}>
                <div className="notif-header">
                    <h3>Notifications</h3>
                    <button className="notif-close" onClick={() => setNotifPanelOpen(false)}>&times;</button>
                </div>
                <ul className="notif-list">
                    <li className="notif-item unread" onClick={() => { window.location.href = 'acheter.html'; }}>
                        <div className="notif-thumb-wrap"><div className="notif-dot"></div><img src="images/stock/oaksome-v8-ambiance-line-1.jpg" alt="" className="notif-thumb" /></div>
                        <div className="notif-content">
                            <div className="notif-title">Offre de lancement</div>
                            <div className="notif-desc">Conditions privilégiées sur une sélection de meubles.</div>
                            <span className="notif-time">Aujourd&apos;hui</span>
                        </div>
                        <span className="notif-arrow">›</span>
                    </li>
                    <li className="notif-item unread" onClick={() => { window.location.href = 'collections.html'; }}>
                        <div className="notif-thumb-wrap"><div className="notif-dot"></div><img src="images/stock/oaksome-v8-ambiance-satori-1.jpg" alt="" className="notif-thumb" /></div>
                        <div className="notif-content">
                            <div className="notif-title">4 collections disponibles</div>
                            <div className="notif-desc">Line, Satori, Vista et Lys. Quatre univers.</div>
                            <span className="notif-time">Nouveau</span>
                        </div>
                        <span className="notif-arrow">›</span>
                    </li>
                    <li className="notif-item unread" onClick={() => { window.location.href = 'echantillons.html'; }}>
                        <div className="notif-thumb-wrap"><div className="notif-dot"></div><img src="images/stock/oaksome-v8-ambiance-vista-1.jpg" alt="" className="notif-thumb" /></div>
                        <div className="notif-content">
                            <div className="notif-title">Échantillons gratuits</div>
                            <div className="notif-desc">Commandez jusqu&apos;à 5 échantillons. Livraison gratuite.</div>
                            <span className="notif-time">Nouveau</span>
                        </div>
                        <span className="notif-arrow">›</span>
                    </li>
                    <li className="notif-item" onClick={() => { window.location.href = 'configurer.html'; }}>
                        <div className="notif-thumb-wrap"><img src="images/stock/oaksome-v8-ambiance-line-2.jpg" alt="" className="notif-thumb" /></div>
                        <div className="notif-content">
                            <div className="notif-title">Configurateur en ligne</div>
                            <div className="notif-desc">Configurez votre meuble et obtenez un prix en quelques clics.</div>
                            <span className="notif-time">Mai 2026</span>
                        </div>
                        <span className="notif-arrow">›</span>
                    </li>
                    <li className="notif-item" onClick={() => { window.location.href = 'comment-ca-marche.html'; }}>
                        <div className="notif-thumb-wrap"><img src="images/stock/oaksome-v8-ambiance-lys-1.jpg" alt="" className="notif-thumb" /></div>
                        <div className="notif-content">
                            <div className="notif-title">Comment ça marche ?</div>
                            <div className="notif-desc">5 étapes du configurateur à l&apos;installation chez vous.</div>
                            <span className="notif-time">Guide</span>
                        </div>
                        <span className="notif-arrow">›</span>
                    </li>
                </ul>
                <div style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <span style={{ fontFamily: "'PP Air Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)' }}>
                        Toutes les notifications sont à jour
                    </span>
                </div>
            </div>

            <div className="help-fab" onClick={() => setHelpChatOpen(!helpChatOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Besoin d&apos;aide ?</span>
            </div>
            <div className={`help-chat${helpChatOpen ? ' open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <strong>Vercelsome</strong>
                    <span onClick={() => setHelpChatOpen(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>&times;</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    Notre assistant sera bientôt disponible. En attendant, contactez-nous directement.
                </p>
                <a href="contact.html" className="btn btn-primary" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                    Nous contacter
                </a>
            </div>
        </>
    );
}
