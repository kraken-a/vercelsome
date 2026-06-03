
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation'
import './acheter.css'
import Assurance from '@/components/assurance/assurance';
import { useWishlist } from '@/features/wishlist/hooks'

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

interface OdooProduct {
  id: number;
  name: string;
  list_price: number;
  description_sale: string | false;
  is_new: boolean;
  is_basic: boolean;
  is_premium: boolean;
  discount: number | false;
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
}

function ProductCard({ product, isWishlisted, onToggleWishlist }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations('shop.acheter');
  const shopT = useTranslations('shop');
  const [dotIndex, setDotIndex] = useState(0);
  const images = useMemo(() => getProductImages(product), [product]);
  const allColorValues = useMemo(() => getProductColorValues(product), [product]);
  const visibleValues = allColorValues.slice(0, 3);
  const extraValues = allColorValues.length - visibleValues.length;

  const gamme = product.public_categ_ids[0]?.name ?? '';
  const space = product.space_ids[0]?.name ?? '';
  const collection = product.style_ids[0]?.name ?? '';
  const finitionLabel = product.finition_ids[0]?.name ?? null;
  const finitionClass = product.is_premium ? 'badge-finition atelier' : 'badge-finition';

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setDotIndex(idx);
  };

  return (
    <div className="product-card">
      <div className="product-img">
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

      <div className="product-info">
        <p className="price">{new Intl.NumberFormat(currencyLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(product.list_price)}</p>
        <h4>{product.name}</h4>
        <div className="product-meta">
          {finitionLabel && <span className={finitionClass}>{finitionLabel}</span>}
          <span className="badge-delai">{t('badge_delai')}</span>
        </div>
        <div className="product-tags">
          {gamme && <span className="product-tag">{gamme.toUpperCase()}</span>}
          {space && <span className="product-tag">{space.toUpperCase()}</span>}
          {collection && <span className="product-tag tag-collection">{collection.toUpperCase()}</span>}
        </div>
      </div>

      <div className="product-footer">
        <div className="color-dots">
          {visibleValues.map(v =>
            v.color_hex
              ? <span key={v.id} className="color-dot" style={{ background: v.color_hex, ...(v.color_hex === '#FFFFFF' ? { borderColor: '#ddd' } : {}) }} title={v.name} />
              : <img key={v.id} className="color-dot" src={`data:image/png;base64,${v.value_image}`} title={v.name} alt={v.name} />
          )}
          {extraValues > 0 && <span className="color-more">+{extraValues}</span>}
        </div>
        <Link href="/configurer" className="btn-configure">{shopT('btn_configure')}</Link>
      </div>
    </div>
  );
}


export default function AcheterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('shop.acheter');
  const shopT = useTranslations('shop');
  const [products, setProducts] = useState<OdooProduct[]>([]);
  const [styles, setStyles] = useState<{ id: number; name: string }[]>([]);
  const [spaces, setSpaces] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [finitions, setFinitions] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => {
    const f = searchParams.get('filters');
    return f ? new Set(f.split(',').filter(Boolean)) : new Set();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { wishlist, addItem: addToWishlistItem, removeItem: removeFromWishlistItem, isInWishlist } = useWishlist();

  useEffect(() => {
    fetch('/api/odoo/product')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch('/api/odoo/styles')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStyles(data); })
      .catch(console.error);

    fetch('/api/odoo/spaces')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSpaces(data); })
      .catch(console.error);

    fetch('/api/odoo/categories')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(console.error);

    fetch('/api/odoo/finitions')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFinitions(data); })
      .catch(console.error);
  }, []);

  const toggleWishlist = async (productId: number) => {
    const existing = wishlist.items.find(i => i.productId === productId);
    if (existing) {
      await removeFromWishlistItem(existing.id);
    } else {
      await addToWishlistItem(productId);
    }
  };

  const updateUrl = useCallback((filters: Set<string>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.size === 0) {
      params.delete('filters');
    } else {
      params.set('filters', Array.from(filters).join(','));
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const toggleFilter = (filter: string) => {
    setVisibleCount(PAGE_SIZE);
    if (filter === 'all') {
      setActiveFilters(new Set());
      updateUrl(new Set());
      return;
    }
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter); else next.add(filter);
      updateUrl(next);
      return next;
    });
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
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        if (p.list_price < min || p.list_price > max) return false;
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
  }, [products, activeFilters, searchQuery, priceRange, styles, spaces, categories, finitions]);

  const showing = filtered.slice(0, visibleCount);
  const remaining = filtered.length - showing.length;
  const isDefault = activeFilters.size === 0 && !searchQuery && priceRange === 'all';

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
        <div className="filter-bar">
          <span
            className={`filter-chip${activeFilters.size === 0 ? ' active' : ''}`}
            onClick={() => toggleFilter('all')}
          >
            {t('filter_all')}
          </span>
          <span className="filter-sep" />

          <span className="filter-group-label">{t('filter_collection')}</span>
          {styles.map(s => {
            const slug = slugify(s.name);
            return (
              <span
                key={s.id}
                className={`filter-chip${activeFilters.has(slug) ? ' active' : ''}`}
                onClick={() => toggleFilter(slug)}
              >
                {s.name}
              </span>
            );
          })}
          <span className="filter-sep" />

          {spaces.length > 0 && (
            <>
              <span className="filter-group-label">{t('filter_space')}</span>
              {spaces.map(s => {
                const slug = slugify(s.name);
                return (
                  <span
                    key={s.id}
                    className={`filter-chip${activeFilters.has(slug) ? ' active' : ''}`}
                    onClick={() => toggleFilter(slug)}
                  >
                    {s.name}
                  </span>
                );
              })}
              <span className="filter-sep" />
            </>
          )}

          <span className="filter-group-label">{t('filter_type')}</span>
          {categories.map(c => {
            const slug = slugify(c.name);
            return (
              <span
                key={c.id}
                className={`filter-chip${activeFilters.has(slug) ? ' active' : ''}`}
                onClick={() => toggleFilter(slug)}
              >
                {c.name}
              </span>
            );
          })}
          <span className="filter-sep" />

          {finitions.length > 0 && (
            <>
              <span className="filter-group-label">{t('filter_finition')}</span>
              {finitions.map(f => {
                const slug = slugify(f.name)
                return (
                  <span
                    key={f.id}
                    className={`filter-chip${activeFilters.has(slug) ? ' active' : ''}`}
                    onClick={() => toggleFilter(slug)}
                  >
                    {f.name}
                  </span>
                )
              })}
            </>
          )}
          <span className="filter-sep" />

          <span className="filter-group-label">{t('filter_budget')}</span>
          <div className="price-filter">
            <select value={priceRange} onChange={e => { setPriceRange(e.target.value); setVisibleCount(PAGE_SIZE); }}>
              <option value="all">{t('price_all')}</option>
              <option value="0-2000">{t('price_under_2000')}</option>
              <option value="2000-4000">{t('price_2000_4000')}</option>
              <option value="4000-6000">{t('price_4000_6000')}</option>
              <option value="6000-99999">{t('price_over_6000')}</option>
            </select>
          </div>
        </div>

        <p className="result-count">
          {loading
            ? t('result_loading')
            : isDefault
              ? t('result_default', { count: products.length })
              : t(filtered.length === 1 ? 'result_filtered' : 'result_filtered_plural', { filtered: filtered.length, total: products.length })}
        </p>
      </div>

      <section style={{ paddingTop: 0 }}>
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
              : showing.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={isInWishlist(p.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
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
    </>
  );
}
