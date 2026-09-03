
'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { ComponentProps } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation'
import './acheter.css'
import Assurance from '@/components/assurance/assurance';
import { useWishlist } from '@/features/wishlist/hooks'
import { trackViewItemList, trackSelectItem, trackSearch, trackAbVariant, trackAbFilterUsed } from '@/features/tracking/events'

interface ConfigValue {
  id: number;
  name: string;
  color_hex: string | false;
  value_image: string | false;
}

interface ConfigLine {
  id: number;
  allowed_value_ids: ConfigValue[];
}

interface ProductImage {
  id: number;
  image: string;
  sequence: number;
}

interface ProductCategory {
  id: number;
  name: string;
  slug?: string;
}

interface ProductStyle {
  id: number;
  name: string;
  slug?: string;
}

interface ProductSpace {
  id: number;
  name: string;
  slug?: string;
}

interface ProductFinition {
  id: number;
  name: string;
}

interface ShopInsert {
  id: number
  title: string
  subtitle: string
  image_url: string | false
  position: number
  link: string
  cta_label: string
}

type LocalizedHref = ComponentProps<typeof Link>['href']

interface OdooProduct {
  id: number;
  name: string;
  list_price: number;
  description_sale: string | false;
  is_new: boolean;
  is_basic: boolean;
  is_premium: boolean;
  discount: number | false;
  dim_width: number;
  dim_height: number;
  dim_length: number;
  image_1920: string | false;
  image_1024: string | false;
  additional_image_ids: ProductImage[];
  config_line_ids: ConfigLine[];
  style_ids: ProductStyle[];
  space_ids: ProductSpace[];
  finition_ids: ProductFinition[];
  public_categ_ids: ProductCategory[];
}


const PAGE_SIZE = 12;

function currencyLocale(locale: string) {
  return locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-BE' : 'fr-BE';
}

function imgSrc(b64: string | false): string {
  if (!b64) return '/images/stock/oaksome-v8-featured-vista.jpg';
  if (b64.startsWith('data:') || b64.startsWith('http') || b64.startsWith('/')) return b64;
  return `data:image/jpeg;base64,${b64}`;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getProductImages(product: OdooProduct): string[] {
  const main = product.image_1920 || product.image_1024;
  const imgs: string[] = [];
  if (main) imgs.push(imgSrc(main));
  product.additional_image_ids.forEach(img => {
    if (img.image) imgs.push(imgSrc(img.image));
  });
  return imgs.length > 0 ? imgs : ['/images/stock/oaksome-v8-featured-vista.jpg'];
}

function getProductColorValues(product: OdooProduct): ConfigValue[] {
  return product.config_line_ids
    .flatMap(line => line.allowed_value_ids)
    .filter(v => v.color_hex || v.value_image);
}

interface ProductCardProps {
  product: OdooProduct;
  isWishlisted: boolean;
  onToggleWishlist: (id: number) => void;
  index: number;
}

function useFilterVariant(): 'A' | 'B' {
  const [variant, setVariant] = useState<'A' | 'B'>('A')
  useEffect(() => {
    const stored = localStorage.getItem('ab_filter_variant')
    const resolved: 'A' | 'B' = stored === 'A' || stored === 'B' ? stored : Math.random() < 0.5 ? 'A' : 'B'
    if (!stored) {
      localStorage.setItem('ab_filter_variant', resolved)
      trackAbVariant('acheter_filter', resolved)
    }
    setVariant(resolved)
  }, [])
  return variant
}

interface FilterBarBProps {
  spaces: { id: number; name: string }[]
  styles: { id: number; name: string; slug?: string }[]
  categories: { id: number; name: string }[]
  finitions: { id: number; name: string; color_hex?: string }[]
  activeFilters: Set<string>
  toggleFilter: (slug: string) => void
  priceRange: string
  setPriceRange: (v: string) => void
}

function FilterBarB({ spaces, styles, categories, finitions, activeFilters, toggleFilter, priceRange, setPriceRange }: FilterBarBProps) {
  const t = useTranslations('shop.acheter')
  const [open, setOpen] = useState<Set<string>>(new Set())

  const toggle = (key: string) => setOpen(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  return (
    <div className="facet-filter">
      <span className="facet-sortby">{t('filter_trier_par')}</span>
      <div className="facet-groups">
        <div className={`facet-group${open.has('espace') ? ' open' : ''}`}>
          <button className="facet-toggle" onClick={() => toggle('espace')}>{t('filter_espace')}</button>
          <div className="facet-options">
            {spaces.map(s => {
              const slug = slugify(s.name)
              return <button key={s.id} className={`facet-opt${activeFilters.has(slug) ? ' active' : ''}`} onClick={() => toggleFilter(slug)}>{s.name}</button>
            })}
          </div>
        </div>

        <div className={`facet-group${open.has('style') ? ' open' : ''}`}>
          <button className="facet-toggle" onClick={() => toggle('style')}>{t('filter_style')}</button>
          <div className="facet-options">
            {styles.map(s => {
              const slug = slugify(s.slug ?? s.name)
              return <button key={s.id} className={`facet-opt${activeFilters.has(slug) ? ' active' : ''}`} onClick={() => toggleFilter(slug)}>{s.name}</button>
            })}
          </div>
        </div>

        <div className={`facet-group${open.has('produit') ? ' open' : ''}`}>
          <button className="facet-toggle" onClick={() => toggle('produit')}>{t('filter_produit')}</button>
          <div className="facet-options">
            {categories.map(c => {
              const slug = slugify(c.name)
              return <button key={c.id} className={`facet-opt${activeFilters.has(slug) ? ' active' : ''}`} onClick={() => toggleFilter(slug)}>{c.name}</button>
            })}
          </div>
        </div>

        <div className={`facet-group${open.has('finition') ? ' open' : ''}`}>
          <button className="facet-toggle" onClick={() => toggle('finition')}>{t('filter_finition')}</button>
          <div className="facet-options">
            {finitions.map(f => {
              const slug = slugify(f.name)
              return <button key={f.id} className={`facet-opt${activeFilters.has(slug) ? ' active' : ''}`} onClick={() => toggleFilter(slug)}>{f.name}</button>
            })}
          </div>
        </div>

        <div className={`facet-group${open.has('budget') ? ' open' : ''}`}>
          <button className="facet-toggle" onClick={() => toggle('budget')}>{t('filter_budget')}</button>
          <div className="facet-options">
            <select className="fb-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
              <option value="all">{t('price_all')}</option>
              <option value="0-2000">{t('price_0_2000')}</option>
              <option value="2000-4000">{t('price_2000_4000')}</option>
              <option value="4000-6000">{t('price_4000_6000')}</option>
              <option value="6000+">{t('price_6000_plus')}</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  )
}

function ProductCard({ product, isWishlisted, onToggleWishlist, index }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations('shop.acheter');
  const shopT = useTranslations('shop');
  const router = useRouter();
  const configureUrl = `/${locale}/configurer?template_id=${product.id}`;
  const [dotIndex, setDotIndex] = useState(0);
  const images = useMemo(() => getProductImages(product), [product]);

  const gamme      = product.public_categ_ids[0]?.name ?? '';
  const space      = product.space_ids[0]?.name ?? '';
  const collection = product.style_ids[0]?.name ?? '';

  const badgeClass = product.is_new ? 'badge-new' : product.is_premium ? 'badge-premium' : product.is_basic ? 'badge-basic' : null;
  const badgeLabel = product.is_new ? 'NOUVEAUTÉ' : product.is_premium ? 'PREMIUM' : product.is_basic ? 'BASIQUES' : null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth);
    setDotIndex(idx);
  };

  const priceStr = new Intl.NumberFormat(currencyLocale(locale), {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(product.list_price);

  return (
    <div
      className="product-card"
      style={{ cursor: 'pointer' }}
      onClick={() => router.push(configureUrl)}
    >
      {/* Image */}
      <div className="product-img">
        {badgeClass && <span className={`product-badge ${badgeClass}`}>{badgeLabel}</span>}
        <button
          className={`wishlist-btn${isWishlisted ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
          aria-label={t('aria_wishlist_save')}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>
        <div className="product-img-carousel" onScroll={handleScroll}>
          {images.map((src, j) => (
            <img
              key={j}
              src={src}
              alt={j > 0 ? t('img_alt_extra', { name: product.name, index: j + 1 }) : product.name}
              loading="lazy"
              className={j > 0 ? 'hover-img' : undefined}
            />
          ))}
        </div>
        {images.length > 1 && (
          <div className="carousel-dots">
            {images.map((_, j) => (
              <span key={j} className={`carousel-dot${j === dotIndex ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="product-meta">
        <span className="price">{priceStr} <span className="badge-ttc">TTC</span></span>
      </div>

      {/* CTA */}
      <div className="product-cta">
        <Link
          href={{ pathname: '/configurer', query: { template_id: String(product.id) } }}
          className="btn-configure"
          onClick={() => trackSelectItem({ id: product.id, name: product.name, listName: 'Catalogue', index })}
        >{shopT('btn_configure')}</Link>
        <button className="btn-add-product" aria-label={t('aria_add_cart')} onClick={(e) => e.stopPropagation()}>+</button>
      </div>

      {/* Details */}
      <div className="product-details">
        <h4>{product.name}</h4>
        <p className={`product-dims${(product.dim_width > 0 || product.dim_height > 0 || product.dim_length > 0) ? '' : ' product-dims--hidden'}`}>
          {[
            product.dim_width  > 0 ? `L ${product.dim_width}`  : null,
            product.dim_height > 0 ? `H ${product.dim_height}` : null,
            product.dim_length > 0 ? `P ${product.dim_length}` : null,
          ].filter(Boolean).join(' × ')} cm
        </p>
        <div className="product-tags">
          {gamme      && <span className="product-tag">{gamme.toUpperCase()}</span>}
          {space      && <span className="product-tag">{space.toUpperCase()}</span>}
          {collection && <span className="product-tag tag-collection">{collection.toUpperCase()}</span>}
        </div>
      </div>
    </div>
  );
}


export default function AcheterPage() {
  const filterVariant = useFilterVariant();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('shop.acheter');
  const shopT = useTranslations('shop');
  const [products, setProducts] = useState<OdooProduct[]>([]);
  const [styles, setStyles] = useState<{ id: number; name: string; slug?: string; image_url?: string; description?: string }[]>([]);
  const [spaces, setSpaces] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; slug?: string; image_url?: string }[]>([]);
  const [finitions, setFinitions] = useState<{ id: number; name: string; color_hex?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [inserts, setInserts] = useState<ShopInsert[]>([]);
  const typeParam = searchParams.get('type') ?? null;
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => {
    const f = searchParams.get('filters');
    return f ? new Set(f.split(',').filter(Boolean)) : new Set();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState(() => searchParams.get('price') ?? 'all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { wishlist, addItem: addToWishlistItem, removeItem: removeFromWishlistItem, isInWishlist } = useWishlist();
  const stylesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());
  const [showFab, setShowFab] = useState(false);
  const productsRef = useRef<HTMLElement>(null);

  const updateScrollBtns = () => {
    const el = stylesScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    // initialise après que les styles sont chargés
    updateScrollBtns();
  }, [styles]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const spaceSlugs  = new Set(spaces.map(s => slugify(s.name)));
    const styleSlugs  = new Set(styles.map(s => slugify(s.slug ?? s.name)));
    const categSlugs  = new Set(categories.map(c => slugify(c.name)));
    const finitionSlugs = new Set(finitions.map(f => slugify(f.name)));
    const sections = new Set<string>();
    activeFilters.forEach(f => {
      if (spaceSlugs.has(f))    sections.add('espace');
      if (styleSlugs.has(f))    sections.add('collection');
      if (categSlugs.has(f))    sections.add('categorie');
      if (finitionSlugs.has(f)) sections.add('finition');
    });
    if (priceRange !== 'all') sections.add('budget');
    setOpenSections(sections);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen]);

  useEffect(() => {
    const handleScroll = () => setShowFab(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const scrollStyles = (dir: 'left' | 'right') => {
    if (!stylesScrollRef.current) return;
    const card = stylesScrollRef.current.querySelector('.nf-style-card') as HTMLElement | null;
    const step = card ? card.offsetWidth + 10 : 280;
    stylesScrollRef.current.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' });
  };

  const locale = useLocale();

  useEffect(() => {
    const lang = `?lang=${locale}`;

    fetch(`/api/odoo/product${lang}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch(`/api/odoo/styles${lang}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStyles(data); })
      .catch(console.error);

    fetch(`/api/odoo/spaces${lang}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSpaces(data); })
      .catch(console.error);

    fetch(`/api/odoo/categories${lang}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(console.error);

    fetch(`/api/odoo/finitions${lang}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFinitions(data); })
      .catch(console.error);

    fetch(`/api/odoo/shop-inserts${lang}&page=acheter`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setInserts(data); })
      .catch(console.error);
  }, [locale]);

  const toggleWishlist = async (productId: number) => {
    const existing = wishlist.items.find(i => i.productId === productId);
    if (existing) {
      await removeFromWishlistItem(existing.id);
    } else {
      await addToWishlistItem(productId);
    }
  };

  const updateUrl = useCallback((filters: Set<string>, price?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.size === 0) {
      params.delete('filters');
    } else {
      params.set('filters', Array.from(filters).join(','));
    }
    const p = price ?? searchParams.get('price') ?? 'all';
    if (p === 'all') {
      params.delete('price');
    } else {
      params.set('price', p);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handlePriceRange = (value: string) => {
    setPriceRange(value);
    updateUrl(activeFilters, value);
  };

  const toggleFilter = (filter: string) => {
    setVisibleCount(PAGE_SIZE);
    if (filter === 'all') {
      setActiveFilters(new Set());
      setPriceRange('all');
      updateUrl(new Set(), 'all');
      return;
    }
    const next = new Set(activeFilters);
    if (next.has(filter)) next.delete(filter); else next.add(filter);
    setActiveFilters(next);
    updateUrl(next);
    trackAbFilterUsed(filterVariant, filter);
  };

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const styleSlugs = new Set(styles.map(s => slugify(s.name)));
    const spaceSlugs = new Set(spaces.map(s => slugify(s.name)));
    const categorySlugs = new Set(categories.map(c => slugify(c.name)));
    const finitionSlugs = new Set(finitions.map(f => slugify(f.name)));

    const activeStyles = new Set([...activeFilters].filter(f => styleSlugs.has(f)));
    const activeSpaces = new Set([...activeFilters].filter(f => spaceSlugs.has(f)));
    const activeCategories = new Set([...activeFilters].filter(f => categorySlugs.has(f)));
    const activeFinitions = new Set([...activeFilters].filter(f => finitionSlugs.has(f)));

    return products.filter(p => {
      if (typeParam) {
        const typeSlug = (p.public_categ_ids as Array<{ id: number; name: string; slug?: string }>)[0]?.slug
        if (typeSlug !== typeParam) return false
      }
      if (priceRange !== 'all') {
        if (priceRange.endsWith('+')) {
          const min = Number(priceRange.slice(0, -1));
          if (p.list_price < min) return false;
        } else {
          const [min, max] = priceRange.split('-').map(Number);
          if (p.list_price < min || p.list_price > max) return false;
        }
      }
      if (query) {
        const searchable = [p.name, ...p.style_ids.map(s => s.name), ...p.public_categ_ids.map(c => c.name)]
          .join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      if (activeFilters.size === 0) return true;

      const pStyles = new Set(p.style_ids.map(s => slugify(s.slug ?? s.name)));
      const pSpaces = new Set(p.space_ids.map(s => slugify(s.slug ?? s.name)));
      const pCategories = new Set(p.public_categ_ids.map(c => slugify(c.name)));
      const pFinitions = new Set(p.finition_ids.map(f => slugify(f.name)));

      if (activeStyles.size > 0 && ![...activeStyles].some(f => pStyles.has(f))) return false;
      if (activeSpaces.size > 0 && ![...activeSpaces].some(f => pSpaces.has(f))) return false;
      if (activeCategories.size > 0 && ![...activeCategories].some(f => pCategories.has(f))) return false;
      if (activeFinitions.size > 0 && ![...activeFinitions].some(f => pFinitions.has(f))) return false;

      return true;
    });
  }, [products, activeFilters, searchQuery, priceRange, styles, spaces, categories, finitions, typeParam]);

  const filterLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    styles.forEach(s => map.set(slugify(s.slug ?? s.name), s.name));
    categories.forEach(c => map.set(slugify(c.name), c.name));
    finitions.forEach(f => map.set(slugify(f.name), f.name));
    return map;
  }, [styles, categories, finitions]);

  const filterCounts = useMemo(() => {
    const style = new Map<string, number>();
    const space = new Map<string, number>();
    const categ = new Map<string, number>();
    const finit = new Map<string, number>();
    products.forEach(p => {
      p.style_ids.forEach(s => { const k = slugify(s.slug ?? s.name); style.set(k, (style.get(k) || 0) + 1); });
      p.space_ids.forEach(s => { const k = slugify(s.name); space.set(k, (space.get(k) || 0) + 1); });
      p.public_categ_ids.forEach(c => { const k = slugify(c.name); categ.set(k, (categ.get(k) || 0) + 1); });
      p.finition_ids.forEach(f => { const k = slugify(f.name); finit.set(k, (finit.get(k) || 0) + 1); });
    });
    return { style, space, categ, finit };
  }, [products]);

  const showing = filtered.slice(0, visibleCount);
  const remaining = filtered.length - showing.length;
  const isDefault = activeFilters.size === 0 && !searchQuery && priceRange === 'all' && !typeParam;
  const totalActiveFilters = activeFilters.size + (priceRange !== 'all' ? 1 : 0);

  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (loading || showing.length === 0) return
    if (trackTimerRef.current) clearTimeout(trackTimerRef.current)
    trackTimerRef.current = setTimeout(() => {
      trackViewItemList('Catalogue', showing.map(p => ({ id: p.id, name: p.name })))
    }, 500)
    return () => { if (trackTimerRef.current) clearTimeout(trackTimerRef.current) }
  }, [showing, loading])

  const searchTrackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) return
    if (searchTrackTimer.current) clearTimeout(searchTrackTimer.current)
    searchTrackTimer.current = setTimeout(() => {
      trackSearch(q, filtered.length)
    }, 800)
    return () => { if (searchTrackTimer.current) clearTimeout(searchTrackTimer.current) }
  }, [searchQuery, filtered.length])

  return (
    <>
      <div className="breadcrumb container">
        <Link href="/">{shopT('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_current')}
      </div>

      <div className="shop-hero">
        <span className="section-tag">{t('section_tag')}</span>
        <h1 style={{ fontSize: '2.5rem' }}>{t('h1')}</h1>
        <p>{t('intro')}</p>
      </div>

      <div className="container">
        <div className="shop-search">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <div className="container">
        {filterVariant === 'B' ? (
          <FilterBarB
            spaces={spaces}
            styles={styles}
            categories={categories}
            finitions={finitions}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            priceRange={priceRange}
            setPriceRange={handlePriceRange}
          />
        ) : (
        <div className="nf-zone">

          {/* Bloc 1 — Styles / Collections */}
          <div className="nf-styles-wrap">
            {canScrollLeft && (
              <button className="nf-nav-btn nf-nav-btn--left" onClick={() => scrollStyles('left')} aria-label="Collections précédentes">
                <svg width="8" height="13" viewBox="0 0 10 17" fill="none" aria-hidden="true">
                  <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <div
              className="nf-styles-scroll"
              ref={stylesScrollRef}
              onScroll={updateScrollBtns}
            >
              {styles.map(s => {
                const slug = slugify(s.slug ?? s.name);
                const active = activeFilters.has(slug);
                return (
                  <button
                    key={s.id}
                    className={`nf-style-card${active ? ' nf-style-card--active' : ''}`}
                    onClick={() => toggleFilter(slug)}
                  >
                    {s.image_url
                      ? <img className="nf-style-card__img" src={s.image_url} alt={s.name} />
                      : <div className="nf-style-card__img nf-style-card__img--fallback" />
                    }
                    <div className="nf-style-card__gradient" aria-hidden="true" />
                    {active && <div className="nf-style-card__check" aria-hidden="true" />}
                    <div className="nf-style-card__info">
                      <div className="nf-style-card__text">
                        <span className="nf-style-card__name">{s.name}</span>
                        {s.description && (
                          <span className="nf-style-card__desc">{s.description}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {canScrollRight && (
              <button className="nf-nav-btn nf-nav-btn--right" onClick={() => scrollStyles('right')} aria-label="Collections suivantes">
                <svg width="8" height="13" viewBox="0 0 10 17" fill="none" aria-hidden="true">
                  <path d="M1.5 1.5L8.5 8.5L1.5 15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          <div className="nf-divider" aria-hidden="true" />

          {/* Bloc 2 — Catégories */}
          <div className="nf-cats">
            {categories.map(c => {
              const slug = slugify(c.name);
              const active = activeFilters.has(slug);
              return (
                <button
                  key={c.id}
                  className={`nf-cat-item${active ? ' nf-cat-item--active' : ''}`}
                  onClick={() => toggleFilter(slug)}
                >
                  <div
                    className="nf-cat-item__img"
                    style={c.image_url ? { backgroundImage: `url(${c.image_url})` } : undefined}
                  />
                  <span className="nf-cat-item__label">{c.name}</span>
                </button>
              );
            })}
          </div>

          <div className="nf-divider" aria-hidden="true" />

          {/* Bloc 3 — Finitions + Tous les filtres */}
          <div className="nf-finitions-row">
            {finitions.length > 0 && (
              <div className="nf-finitions">
                <span className="nf-finitions__label">{t('filter_finition')}</span>
                <div className="nf-finitions__swatches">
                  {finitions.map(f => {
                    const slug = slugify(f.name);
                    const active = activeFilters.has(slug);
                    return (
                      <button
                        key={f.id}
                        className={`nf-swatch${active ? ' nf-swatch--active' : ''}`}
                        onClick={() => toggleFilter(slug)}
                      >
                        <div className="nf-swatch__dot" style={f.color_hex ? { background: f.color_hex } : undefined} />
                        <span className="nf-swatch__label">{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <button className="nf-all-filters" onClick={() => setSidebarOpen(true)}>
              {t('filter_all_filters')}
              {totalActiveFilters > 0 && (
                <span className="nf-all-filters__badge">{totalActiveFilters}</span>
              )}
            </button>
          </div>

          {/* Chips filtres actifs */}
          {activeFilters.size > 0 && (
            <div className="nf-chips-row">
              {[...activeFilters].map(slug => (
                <button key={slug} className="nf-chip" onClick={() => toggleFilter(slug)}>
                  {filterLabelMap.get(slug) ?? slug}
                  <span className="nf-chip__x" aria-hidden="true">×</span>
                </button>
              ))}
              <button className="nf-reset" onClick={() => toggleFilter('all')}>
                {t('filter_reset')}
              </button>
            </div>
          )}

        </div>
        )}

        <div className="result-count-row">
          <p className="result-count">
            {loading
              ? t('result_loading')
              : isDefault
                ? t('result_default', { count: products.length })
                : t(filtered.length === 1 ? 'result_filtered' : 'result_filtered_plural', { filtered: filtered.length, total: products.length })}
          </p>
          {filterVariant === 'B' && (activeFilters.size > 0 || priceRange !== 'all') && (
            <button className="facet-reset" onClick={() => toggleFilter('all')}>
              {t('filter_reset')}
            </button>
          )}
        </div>
      </div>

      <section ref={productsRef} style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="shop-grid">
            <Link href="/configurer" className="cta-card">
              <div style={{ fontSize: '3rem' }}>✦</div>
              <h3>{t('cta_card_h3')}</h3>
              <p>{t('cta_card_p')}</p>
            </Link>
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="product-card product-card--skeleton" />
              ))
              : (() => {
                const insertMap = new Map(inserts.map(ins => [ins.position, ins]));
                const items: React.ReactNode[] = [];
                let productIndex = 0;
                let slotIndex = 1; // slot 0 = CTA card
                while (productIndex < showing.length) {
                  const insert = insertMap.get(slotIndex);
                  if (insert) {
                    items.push(
                      <div key={`insert-${insert.id}`} className="shop-insert-card">
                        <div className="shop-insert-card__body">
                          {insert.title && <p className="shop-insert-card__title">{insert.title}</p>}
                          {insert.subtitle && <p className="shop-insert-card__subtitle">{insert.subtitle}</p>}
                          {insert.link && insert.cta_label && (
                            <Link href={insert.link as LocalizedHref} className="shop-insert-card__cta">
                              {insert.cta_label}
                            </Link>
                          )}
                        </div>
                        {insert.image_url && (
                          <div className="shop-insert-card__image">
                            <img src={insert.image_url} alt={insert.title || ''} />
                          </div>
                        )}
                      </div>
                    );
                    slotIndex++;
                  } else {
                    const p = showing[productIndex];
                    items.push(
                      <ProductCard
                        key={p.id}
                        product={p}
                        isWishlisted={isInWishlist(p.id)}
                        onToggleWishlist={toggleWishlist}
                        index={productIndex}
                      />
                    );
                    productIndex++;
                    slotIndex++;
                  }
                }
                return items;
              })()}
          </div>

          {remaining > 0 && (
            <div style={{ textAlign: 'center', margin: '3rem 0' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              >
                {t('load_more')}{' '}
                <span className="load-more-count">
                  {t(remaining === 1 ? 'load_more_count' : 'load_more_count_plural', { remaining })}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      <Assurance />

      {/* ── Backdrop ── */}
      {sidebarOpen && <div className="sf-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar filtre ── */}
      <div className={`sf-panel${sidebarOpen ? ' sf-panel--open' : ''}`} aria-hidden={!sidebarOpen}>
        <div className="sf-header">
          <span className="sf-title">{t('sidebar_title')}</span>
          <button className="sf-close" onClick={() => setSidebarOpen(false)} aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="sf-body">
          {/* Espace */}
          {spaces.length > 0 && (
            <div className="sf-group">
              <button className="sf-group-header" onClick={() => toggleSection('espace')}>
                <span className="sf-group-label">{t('filter_space')}</span>
                <span className={`sf-group-arrow${openSections.has('espace') ? ' open' : ''}`}>▾</span>
              </button>
              {openSections.has('espace') && (
                <div className="sf-group-body">
                  {spaces.map(s => {
                    const slug = slugify(s.name);
                    const active = activeFilters.has(slug);
                    return (
                      <button key={s.id} className={`sf-option${active ? ' sf-option--active' : ''}`} onClick={() => toggleFilter(slug)}>
                        <div className="sf-checkbox">{active && <div className="sf-checkbox__check" />}</div>
                        <span>{s.name}</span>
                        <span className="sf-count">{filterCounts.space.get(slug) ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Collection */}
          {styles.length > 0 && (
            <div className="sf-group">
              <button className="sf-group-header" onClick={() => toggleSection('collection')}>
                <span className="sf-group-label">{t('filter_collection')}</span>
                <span className={`sf-group-arrow${openSections.has('collection') ? ' open' : ''}`}>▾</span>
              </button>
              {openSections.has('collection') && (
                <div className="sf-group-body">
                  {styles.map(s => {
                    const slug = slugify(s.slug ?? s.name);
                    const active = activeFilters.has(slug);
                    return (
                      <button key={s.id} className={`sf-option${active ? ' sf-option--active' : ''}`} onClick={() => toggleFilter(slug)}>
                        <div className="sf-checkbox">{active && <div className="sf-checkbox__check" />}</div>
                        <span>{s.name}</span>
                        <span className="sf-count">{filterCounts.style.get(slug) ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Catégorie */}
          {categories.length > 0 && (
            <div className="sf-group">
              <button className="sf-group-header" onClick={() => toggleSection('categorie')}>
                <span className="sf-group-label">{t('filter_type')}</span>
                <span className={`sf-group-arrow${openSections.has('categorie') ? ' open' : ''}`}>▾</span>
              </button>
              {openSections.has('categorie') && (
                <div className="sf-group-body">
                  {categories.map(c => {
                    const slug = slugify(c.name);
                    const active = activeFilters.has(slug);
                    return (
                      <button key={c.id} className={`sf-option${active ? ' sf-option--active' : ''}`} onClick={() => toggleFilter(slug)}>
                        <div className="sf-checkbox">{active && <div className="sf-checkbox__check" />}</div>
                        <span>{c.name}</span>
                        <span className="sf-count">{filterCounts.categ.get(slug) ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Finition */}
          {finitions.length > 0 && (
            <div className="sf-group">
              <button className="sf-group-header" onClick={() => toggleSection('finition')}>
                <span className="sf-group-label">{t('filter_finition')}</span>
                <span className={`sf-group-arrow${openSections.has('finition') ? ' open' : ''}`}>▾</span>
              </button>
              {openSections.has('finition') && (
                <div className="sf-group-body">
                  {finitions.map(f => {
                    const slug = slugify(f.name);
                    const active = activeFilters.has(slug);
                    return (
                      <button key={f.id} className={`sf-option${active ? ' sf-option--active' : ''}`} onClick={() => toggleFilter(slug)}>
                        <div className="sf-color-dot" style={f.color_hex ? { background: f.color_hex, borderColor: f.color_hex } : undefined} />
                        <span>{f.name}</span>
                        <span className="sf-count">{filterCounts.finit.get(slug) ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Budget */}
          <div className="sf-group">
            <button className="sf-group-header" onClick={() => toggleSection('budget')}>
              <span className="sf-group-label">{t('filter_budget')}</span>
              <span className={`sf-group-arrow${openSections.has('budget') ? ' open' : ''}`}>▾</span>
            </button>
            {openSections.has('budget') && (
              <div className="sf-group-body">
                <select
                  className="sf-budget-select"
                  value={priceRange}
                  onChange={e => handlePriceRange(e.target.value)}
                >
                  <option value="all">{t('price_all')}</option>
                  <option value="0-2000">{t('price_under_2000')}</option>
                  <option value="2000-4000">{t('price_2000_4000')}</option>
                  <option value="4000-6000">{t('price_4000_6000')}</option>
                  <option value="6000-999999">{t('price_over_6000')}</option>
                </select>
              </div>
            )}
          </div>

          <button className="sf-reset" onClick={() => { toggleFilter('all'); setPriceRange('all'); }}>
            {t('filter_reset')}
          </button>
        </div>

        <div className="sf-footer">
          <button className="sf-show-results" onClick={() => setSidebarOpen(false)}>
            {t('sidebar_show_results', { count: filtered.length })}
          </button>
        </div>
      </div>

      {/* ── FAB — apparaît au scroll dans les produits ── */}
      {showFab && (
        <button className="nf-fab" onClick={() => setSidebarOpen(true)} aria-label={t('filter_all_filters')}>
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <path d="M0 1.5h20M0 8h13M0 14.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="16.5" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="10.5" cy="14.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          {totalActiveFilters > 0 && (
            <span className="nf-fab__badge">{totalActiveFilters}</span>
          )}
        </button>
      )}
    </>
  );
}
