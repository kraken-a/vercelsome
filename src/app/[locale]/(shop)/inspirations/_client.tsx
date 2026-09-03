'use client'
import {useState, useEffect, useRef, useCallback, Fragment} from 'react'
import {Link} from '@/i18n/navigation'
import {useTranslations} from 'next-intl'
import './inspiration.css'
import {getTranslations} from "next-intl/server";

type InspirationProduct = {
    id: number
    name: string
    image_url: string
}

type InspirationImage = {
    id: number
    name: string
    slug: string
    image_url: string
    description: string
    source: string
    city: string

    spaces: {
        id: number
        name: string
        slug: string
    }[]

    styles: {
        id: number
        name: string
        slug: string
    }[]

    categories: {
        id: number
        name: string
        slug: string
    }[]

    products: {
        id: number
        name: string
        image_url: string
    }[]

    case?: {
        id: number
        name: string
        slug: string
    } | null
}
type FilterOption = { id: number; name: string }

type InspirationData = {
    images: InspirationImage[]
    spaces: FilterOption[]
    styles: FilterOption[]
    categories: FilterOption[]
}

type Props = { data: InspirationData }

export function InspirationsClient({data}: Props) {
    const t = useTranslations('shop')
    const tHome = useTranslations()


    const {images, spaces, styles, categories} = data

    const [selectedSpaces, setSelectedSpaces] = useState<string[]>([])
    const [selectedStyles, setSelectedStyles] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [openFilter, setOpenFilter] = useState<string | null>(null)

    const [shuffled, setShuffled] = useState<InspirationImage[]>([])

    const [modalIndex, setModalIndex] = useState<number | null>(null)
    const [zoomLevel, setZoomLevel] = useState(1)
    const [imgPos, setImgPos] = useState({x: 0, y: 0})

    const isDragging = useRef(false)
    const dragStart = useRef({x: 0, y: 0})
    const modalRef = useRef<HTMLDivElement>(null)

    const [openFilters, setOpenFilters] = useState<string[]>([])

    const toggleOpen = (key: string) => {
        setOpenFilters(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        )
    }

    useEffect(() => {
        if (!Array.isArray(images)) return

        const arr = [...images]

        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }

        setShuffled(arr)
    }, [images])
    useEffect(() => {
    }, [shuffled])


    useEffect(() => {
        if (modalIndex === null) return

        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setModalIndex(i =>
                    i !== null && i > 0 ? i - 1 : i
                )
            }

            if (e.key === "ArrowRight") {
                setModalIndex(i =>
                    i !== null && i < filtered.length - 1
                        ? i + 1
                        : i
                )
            }

            if (e.key === "Escape") {
                setModalIndex(null)
            }
        }

        window.addEventListener("keydown", handler)

        return () => window.removeEventListener("keydown", handler)
    }, [modalIndex])


    const toggleFilter = (
        type: "space" | "style" | "category",
        name: string
    ) => {
        const setter =
            type === "space"
                ? setSelectedSpaces
                : type === "style"
                    ? setSelectedStyles
                    : setSelectedCategories

        setter(prev =>
            prev.includes(name)
                ? prev.filter(v => v !== name)
                : [...prev, name]
        )
    }

    const removeFilter = (
        type: "space" | "style" | "category",
        name: string
    ) => toggleFilter(type, name)

    const filtered = shuffled.filter(img => {

        if (
            selectedSpaces.length &&
            !img.spaces.some(s => selectedSpaces.includes(s.name))
        ) {
            return false
        }

        if (
            selectedStyles.length &&
            !img.styles.some(s => selectedStyles.includes(s.name))
        ) {
            return false
        }

        if (
            selectedCategories.length &&
            !img.categories.some(c => selectedCategories.includes(c.name))
        ) {
            return false
        }

        return true
    })

    useEffect(() => {
    }, [filtered])


    const openModal = (index: number) => {
        setModalIndex(index)
        setZoomLevel(1)
        setImgPos({x: 0, y: 0})
    }

    const closeModal = () => {
        setModalIndex(null)
    }

    const activeImage =
        modalIndex !== null
            ? filtered[modalIndex]
            : null

    const activeSpace = activeImage?.spaces?.[0] ?? null
    const activeStyle = activeImage?.styles?.[0] ?? null
    const activeCategory = activeImage?.categories?.[0] ?? null

    const updateTransform = () =>
        `scale(${zoomLevel}) translate(${imgPos.x}px, ${imgPos.y}px)`

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel <= 1) return

        isDragging.current = true

        dragStart.current = {
            x: e.clientX - imgPos.x,
            y: e.clientY - imgPos.y,
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return

        setImgPos({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y,
        })
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    const chipTypes = [
        {
            type: "space" as const,
            values: selectedSpaces,
        },
        {
            type: "style" as const,
            values: selectedStyles,
        },
        {
            type: "category" as const,
            values: selectedCategories,
        },
    ]

    const filterGroups = [
        {
            key: "space" as const,
            label: "Space",
            options: spaces,
            selected: selectedSpaces,
        },
        {
            key: "style" as const,
            label: "Style",
            options: styles,
            selected: selectedStyles,
        },
        {
            key: "category" as const,
            label: "Category",
            options: categories,
            selected: selectedCategories,
        },
    ]
    return (
        <>

            {/*<nav className="breadcrumb-nav container"*/}
            {/*     style={{paddingTop: '168px', fontFamily: '"PP Air Mono", monospace'}}>*/}
            {/*    <Link href="/">Oaksome</Link>*/}
            {/*    <span className="mx-2">—</span>*/}
            {/*    <span>Inspiration</span>*/}
            {/*</nav>*/}

            <div className="breadcrumb">
                <Link href="/">
                    {t('breadcrumb_home')}
                </Link>
                {" "}
                &rsaquo;
                {" "}
                <span>{t('inspirations.breadcrumb_current')}</span>
            </div>

            <main>

                <section className="cat-hero pb-5 mb-5">
                    <div className="container">
                        <h1>
                            {t('inspirations.hero_title_line1')}
                            <br/>
                            {t('inspirations.hero_title_line2')}
                        </h1>
                    </div>
                </section>

                {/*<div className="service-separator" style={{width: '93%', margin: '40px auto 0'}}/>*/}

                <div className="inspo-filter-bar pt-5">
                    <div className="inspo-filter-inner px-4 mx-2">
                        <div className="facet-filter">
                            <span className="facet-sortby">Trier par</span>
                            <div className="facet-groups">
                                {filterGroups.map(group => (
                                    <div
                                        key={group.key}
                                        className={`facet-group${openFilters.includes(group.key) ? ' open' : ''}`}
                                        data-axis={group.key}
                                    >
                                        <button
                                            type="button"
                                            className="facet-toggle"
                                            aria-expanded={openFilters.includes(group.key)}
                                            onClick={() => toggleOpen(group.key)}
                                        >
                                            {group.label}
                                        </button>
                                        <div className="facet-options">
                                            {group.options.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    className={`facet-opt${group.selected.includes(opt.name) ? ' active' : ''}`}
                                                    data-axis={group.key}
                                                    data-val={opt.name}
                                                    onClick={() => toggleFilter(group.key, opt.name)}
                                                >
                                                    {opt.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <span className="inspo-counter">
                            {filtered.length} inspirations
                        </span>
                    </div>
                </div>

                {/* masonry grid */}
                <section className="px-4 pt-1">
                    <div className="masonry-grid mt-3 px-4">
                        {filtered.length > 0 ? (
                            filtered.map((img, i) => (
                                <div
                                    key={img.id}
                                    className="masonry-item"
                                    style={{breakInside: "avoid"}}
                                >
                                    <a
                                        href="#"
                                        className="gallery-card d-block position-relative overflow-hidden open-inspiration-modal"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            openModal(i);
                                        }}
                                    >
                                        <img
                                            src={img.image_url}
                                            className="img-fluid shadow-sm gallery-image-hover"
                                            alt={img.name || "Inspiration"}
                                            loading="lazy"
                                        />

                                        <div className="gallery-overlay">
                                            <h6 className="mb-4">{img.name}</h6>
                                            {img.source && (
                                                <small>{img.source}</small>
                                            )}
                                        </div>
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted">
                                No images match the selected filters.
                            </div>
                        )}
                    </div>
                </section>
            </main>


            {
                activeImage && (
                    <div
                        className="inspo-qv open"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) closeModal()
                        }}
                    >
                        <div
                            className="inspo-qv-dialog"
                            ref={modalRef}
                        >
                            <button
                                className="inspo-qv-close"
                                type="button"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path
                                        d="M0.70775 12.6155L0 11.9078L5.6 6.30775L0 0.70775L0.70775 0L6.30775 5.6L11.9078 0L12.6155 0.70775L7.0155 6.30775L12.6155 11.9078L11.9078 12.6155L6.30775 7.0155L0.70775 12.6155Z"
                                        fill="white"
                                    />
                                </svg>
                            </button>

                            <div className="inspo-qv-card">

                                {/* LEFT */}
                                <div className="inspo-qv-media">

                                    <img
                                        src={activeImage.image_url}
                                        alt={activeImage.name}
                                        style={{
                                            transform: updateTransform(),
                                            cursor: zoomLevel > 1 ? "grab" : "default"
                                        }}
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                    />

                                    {/* tags */}
                                    <div className="inspo-qv-tags">

                                        {activeImage.spaces?.length > 0 && (
                                            <span className="inspo-qv-tag inspo-qv-tag--space">
                                            {activeImage.spaces[0].name}
                                        </span>
                                        )}

                                        {activeImage.styles?.length > 0 && (
                                            <span className="inspo-qv-tag inspo-qv-tag--style">
                                        {activeImage.styles[0].name}
                            </span>
                                        )}

                                    </div>

                                    {/* share */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 16,
                                            left: 16,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: '"PP Air", sans-serif',
                                                fontSize: 11,
                                                color: "#fff",
                                                textTransform: "uppercase",
                                                letterSpacing: "1px",
                                                marginBottom: 8,
                                            }}
                                        >
                                            Share your finding
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 12,
                                            }}
                                        >

                                            {[
                                                {
                                                    id: "fb",
                                                    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                                        typeof window !== "undefined"
                                                            ? window.location.href
                                                            : ""
                                                    )}`,
                                                    icon: (
                                                        <path
                                                            d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                                                    ),
                                                },
                                                {
                                                    id: "tw",
                                                    href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                                        typeof window !== "undefined"
                                                            ? window.location.href
                                                            : ""
                                                    )}&text=${encodeURIComponent(activeImage.name)}`,
                                                    icon: (
                                                        <path
                                                            d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                                                    ),
                                                },
                                            ].map((s) => (
                                                <a
                                                    key={s.id}
                                                    href={s.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{color: "#fff"}}
                                                >
                                                    <svg
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        {s.icon}
                                                    </svg>
                                                </a>
                                            ))}

                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 16,
                                            right: 16,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                        }}
                                    >
                                        <button
                                            onClick={() => setZoomLevel((z) => z + 0.2)}
                                            style={{
                                                background: "rgba(0,0,0,.4)",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                width: 32,
                                                height: 32,
                                                cursor: "pointer",
                                            }}
                                        >
                                            +
                                        </button>

                                        <button
                                            onClick={() =>
                                                setZoomLevel((z) => Math.max(0.4, z - 0.2))
                                            }
                                            style={{
                                                background: "rgba(0,0,0,.4)",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                width: 32,
                                                height: 32,
                                                cursor: "pointer",
                                            }}
                                        >
                                            −
                                        </button>

                                        <button
                                            onClick={() => {
                                                setZoomLevel(1)
                                                setImgPos({x: 0, y: 0})
                                            }}
                                            style={{
                                                background: "rgba(0,0,0,.4)",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                width: 32,
                                                height: 32,
                                                cursor: "pointer",
                                            }}
                                        >
                                            ↺
                                        </button>

                                    </div>

                                </div>

                                <div className="inspo-qv-info">
                                    <div className="inspo-qv-text">
                                        {activeImage.source && (
                                            <span className="inspo-qv-source">
                                            {activeImage.source}
                                        </span>
                                        )}
                                        <h2 className="inspo-qv-title">
                                            {activeImage.name}
                                        </h2>
                                        {activeImage.city && (
                                            <div className="inspo-qv-location">
                                                {activeImage.city}
                                            </div>
                                        )}
                                        <p className="inspo-qv-caption">
                                            {activeImage.description}
                                        </p>
                                        {activeImage.products.length > 0 && (
                                            <div className="inspo-qv-shop">
                                            <span className="inspo-qv-shop-label">
                                                Shop the style
                                            </span>
                                                <div className="inspo-qv-shop-cards">
                                                    {activeImage.products.map(product => (
                                                        <Link
                                                            key={product.id}
                                                            href={{pathname: '/produit/[id]', params: {id: String(product.id)}}}
                                                            className="inspo-qv-shop-card"
                                                        >

                                                        <span className="inspo-qv-shop-thumb">
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                            />
                                                            <span className="inspo-qv-shop-plus">
                                                                +
                                                            </span>
                                                        </span>
                                                            <span className="inspo-qv-shop-name">
                                                            {product.name}
                                                        </span>

                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {modalIndex !== null && modalIndex > 0 && (
                                <button
                                    className="inspo-qv-nav inspo-qv-prev"
                                    onClick={() => {
                                        setModalIndex(i => i !== null ? i - 1 : i)
                                        setZoomLevel(1)
                                        setImgPos({x: 0, y: 0})
                                    }}
                                >
                                    Previous
                                </button>
                            )}

                            {modalIndex !== null &&
                                modalIndex < filtered.length - 1 && (
                                    <button
                                        className="inspo-qv-nav inspo-qv-next"
                                        onClick={() => {
                                            setModalIndex(i =>
                                                i !== null ? i + 1 : i
                                            )
                                            setZoomLevel(1)
                                            setImgPos({x: 0, y: 0})
                                        }}
                                    >
                                        Next
                                    </button>
                                )}

                        </div>
                    </div>
                )
            }
            <section className="newsletter-stoemp" aria-labelledby="ns-title">
                <div className="ns-inner">
                    <h2 id="ns-title" className="ns-title">
                        {tHome('home.newsletter.title_line_1')}
                        <br/>
                        {tHome('home.newsletter.title_line_2')}
                    </h2>
                    <form className="ns-form" action="#" method="post" noValidate>
                        <label className="ns-input-wrap" htmlFor="ns-email">
                            <span style={{
                                position: 'absolute',
                                width: '1px',
                                height: '1px',
                                overflow: 'hidden',
                                clip: 'rect(0,0,0,0)'
                            }}>{tHome('home.newsletter.email_label')}</span>
                            <input id="ns-email" className="ns-input" type="email" name="email"
                                   placeholder={tHome('home.newsletter.email_placeholder')} autoComplete="email"
                                   required/>
                        </label>
                        <button className="ns-submit" type="submit" aria-label={tHome('home.newsletter.submit_label')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                                <polyline points="12 5 19 12 12 19"/>
                            </svg>
                        </button>
                    </form>
                    <div className="ns-legend">
                        <p className="ns-consent">
                            {tHome('home.newsletter.consent')}
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}