import Link from 'next/link'
import { ProductCard } from './product-card'
import type { ProductSummary } from '@/types/product'

type Props = {
  products: ReadonlyArray<ProductSummary>
  showConfiguratorCard?: boolean
}

function getBadge(p: ProductSummary) {
  if (p.is_new) return { key: 'new', label: 'NEW' }
  if (p.is_premium) return { key: 'premium', label: 'PREMIUM' }
  if (p.discount > 0) return { key: 'promo', label: `-${Math.round(p.discount)}%` }
  return null
}

export function ProductGrid({ products, showConfiguratorCard = false }: Props) {
  return (
    <div className="catalogue-grid">
      {/* "Créez le vôtre" card — first slot */}
      {showConfiguratorCard && (
        <Link href="/configurer" className="configurator-card">
          <div className="configurator-card-inner">
            <span className="configurator-card-plus">+</span>
            <p className="configurator-card-title">Créez le vôtre</p>
            <p className="configurator-card-sub">Démarrez de zéro dans le configurateur</p>
          </div>
        </Link>
      )}

      {products.map(p => {
        const tags = [
          p.type_slug ? p.type_slug.replace(/-/g, ' ').toUpperCase() : null,
          p.collection_slug ? p.collection_slug.toUpperCase() : null,
        ].filter(Boolean) as string[]

        return (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            imageUrl={p.image_url}
            priceTtc={p.price_ttc}
            badge={getBadge(p)}
            tags={tags}
            href={`/produit/${p.id}`}
          />
        )
      })}
    </div>
  )
}
