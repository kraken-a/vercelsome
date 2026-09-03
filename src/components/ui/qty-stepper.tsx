'use client'

type Props = {
  value: number
  min?: number
  max?: number
  onChangeAction: (v: number) => void
}

export function QtyStepper({ value, min = 1, max = 99, onChangeAction }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #000', height: '44px' }}>
      <button
        onClick={() => onChangeAction(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{ width: '44px', height: '44px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >−</button>
      <span style={{ width: '40px', textAlign: 'center', fontFamily: "'PP Air Mono',monospace", fontSize: '14px' }}>{value}</span>
      <button
        onClick={() => onChangeAction(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{ width: '44px', height: '44px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >+</button>
    </div>
  )
}
