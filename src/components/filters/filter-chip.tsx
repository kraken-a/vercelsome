'use client'

type Props = {
  label: string
  active?: boolean
  onClickAction?: () => void
}

export function FilterChip({ label, active, onClickAction }: Props) {
  return (
    <button
      type="button"
      className={`filter-chip${active ? ' active' : ''}`}
      onClick={onClickAction}
    >
      {label}
    </button>
  )
}
