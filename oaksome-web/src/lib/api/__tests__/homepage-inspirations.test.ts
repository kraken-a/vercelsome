import { dedupeInspirations, type InspirationCombo } from '../homepage-inspirations'

const combo = (id: number, space_id: number, style_id: number, label = ''): InspirationCombo => ({
  id,
  space_id,
  space_name: `Space ${space_id}`,
  space_slug: `space-${space_id}`,
  style_id,
  style_name: `Style ${style_id}`,
  style_slug: `style-${style_id}`,
  image_url: '',
  label: label || `Space ${space_id} · Style ${style_id}`,
})

describe('dedupeInspirations', () => {
  it('drops a later combo that shares the same space_id+style_id as an earlier one', () => {
    const a = combo(3, 1, 5, 'Salon · Lys')
    const dup = combo(7, 1, 5, 'Salon · Lys')
    const out = dedupeInspirations([a, dup])
    expect(out).toEqual([a])
  })

  it('preserves order and keeps distinct combos', () => {
    const items = [
      combo(1, 1, 1),
      combo(2, 2, 1),
      combo(3, 1, 5),
      combo(4, 1, 2),
      combo(5, 2, 2),
      combo(6, 3, 2),
      combo(7, 1, 5), // duplicate of id=3
      combo(8, 1, 4),
      combo(9, 4, 4),
    ]
    const out = dedupeInspirations(items)
    expect(out.map(c => c.id)).toEqual([1, 2, 3, 4, 5, 6, 8, 9])
  })

  it('returns empty array unchanged', () => {
    expect(dedupeInspirations([])).toEqual([])
  })

  it('does not mutate the input array', () => {
    const items = [combo(1, 1, 1), combo(2, 1, 1)]
    const snapshot = [...items]
    dedupeInspirations(items)
    expect(items).toEqual(snapshot)
  })
})
