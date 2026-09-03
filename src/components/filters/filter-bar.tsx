'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { FilterChip } from './filter-chip'

type FilterOption = {
  label: string
  value: string
}

type FilterGroup = {
  key: string
  label: string
  options: FilterOption[]
}

type Props = {
  groups: FilterGroup[]
}

export function FilterBar({ groups }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeFilters: Record<string, string> = {}
  groups.forEach(g => {
    const v = searchParams.get(g.key)
    if (v) activeFilters[g.key] = v
  })
  const hasActiveFilter = Object.keys(activeFilters).length > 0

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString())
    groups.forEach(g => params.delete(g.key))
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function toggleFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="catalogue-filter-bar">
      {/* TOUS — filled black button */}
      <button
        type="button"
        className={`catalogue-tous${!hasActiveFilter ? ' active' : ''}`}
        onClick={clearAll}
      >
        TOUS
      </button>

      {groups.map(group => (
        <div key={group.key} className="catalogue-filter-group">
          <span className="catalogue-filter-label">{group.label}</span>
          {group.options.map(opt => (
            <FilterChip
              key={opt.value}
              label={opt.label.toUpperCase()}
              active={activeFilters[group.key] === opt.value}
              onClickAction={() => toggleFilter(group.key, opt.value)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
