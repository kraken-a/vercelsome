type Props = {
  price: number
  currency?: string
  prefix?: string
  className?: string
}

export function PriceDisplay({ price, currency = 'EUR', prefix, className }: Props) {
  const formatted = price.toLocaleString('fr-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return (
    <span className={className}>
      {prefix && <span style={{ fontSize: '0.75em', marginRight: '4px' }}>{prefix}</span>}
      {formatted} {currency === 'EUR' ? '€' : currency}
    </span>
  )
}
