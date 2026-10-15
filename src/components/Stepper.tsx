interface Props {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

export default function Stepper({ value, min, max, step, onChange }: Props) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="Decrease">
        −
      </button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="Increase">
        +
      </button>
    </div>
  )
}
