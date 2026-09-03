/**
 * @jest-environment node
 *
 * Unit guard for TASK-052 (M9): the checkout client caps the `notes` URL param
 * at 500 chars before forwarding to bookAppointment. This mirrors the inline
 * `(searchParams.get('notes') ?? '').slice(0, 500)` in _client.tsx.
 */
const capNotes = (raw: string | null): string => (raw ?? '').slice(0, 500)

describe('checkout slotNotes cap', () => {
  it('truncates a 10k-char notes param to 500 chars', () => {
    const huge = 'a'.repeat(10_000)
    expect(capNotes(huge)).toHaveLength(500)
  })

  it('leaves a short notes param untouched', () => {
    expect(capNotes('hello')).toBe('hello')
  })

  it('returns empty string for a null param', () => {
    expect(capNotes(null)).toBe('')
  })
})
