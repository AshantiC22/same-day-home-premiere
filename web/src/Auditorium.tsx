import { memo } from 'react'
import type { RefObject } from 'react'

// The picture behind sign in and sign up: the back row of a dark theater, looking toward the screen.
// Every seat is drawn twice. The first set is almost black. The second set is red velvet with its seat
// number, and only shows through the circle of the usher's flashlight (the CSS mask follows the cursor).

const WIDTH = 1600
const ROWS = 9
const ROW_LETTERS = 'ABCDEFGHI'

type Seat = {
  key: string
  label: string
  transform: string
  body: string
  rim: string
  stitch: string
  fill: string
  rimOpacity: number
  fontSize: number
  labelY: number
}

function n(value: number): string {
  return value.toFixed(1)
}

// Rows far from us (near the screen) are small and high up. Rows close to us are big and low.
// Each row bends a little, like the real rows that curve around the screen.
function buildSeats(): Seat[] {
  const seats: Seat[] = []

  for (let row = 0; row < ROWS; row += 1) {
    const t = row / (ROWS - 1)
    const scale = 0.34 + 0.92 * t
    const rowY = 250 + 640 * Math.pow(t, 1.3)
    const w = 52 * scale
    const h = 60 * scale
    const gap = 11 * scale
    const aisle = 44 * scale
    const r = 15 * scale
    const count = 13 + 2 * row
    const side = Math.floor(count * 0.28)
    const middle = count - 2 * side
    const pitch = w + gap
    const total = count * pitch - gap + 2 * aisle

    const body = `M${n(-w / 2)} 0V${n(-h + r)}Q${n(-w / 2)} ${n(-h)} ${n(-w / 2 + r)} ${n(-h)}H${n(w / 2 - r)}Q${n(w / 2)} ${n(-h)} ${n(w / 2)} ${n(-h + r)}V0Z`
    const rim = `M${n(-w / 2)} ${n(-h + r)}Q${n(-w / 2)} ${n(-h)} ${n(-w / 2 + r)} ${n(-h)}H${n(w / 2 - r)}Q${n(w / 2)} ${n(-h)} ${n(w / 2)} ${n(-h + r)}`
    const inset = 7 * scale
    const stitch = `M${n(-w / 2 + inset)} ${n(-h * 0.42)}V${n(-h + r + inset * 0.3)}Q${n(-w / 2 + inset)} ${n(-h + inset)} ${n(-w / 2 + r)} ${n(-h + inset)}H${n(w / 2 - r)}Q${n(w / 2 - inset)} ${n(-h + inset)} ${n(w / 2 - inset)} ${n(-h + r + inset * 0.3)}V${n(-h * 0.42)}Z`

    // Far rows are lit by the screen a little more, and the ones close to us fall into black.
    const shade = (a: number, b: number) => Math.round(a - (a - b) * t)
    const fill = `rgb(${shade(13, 6)} ${shade(22, 9)} ${shade(31, 13)})`
    const rimOpacity = 0.34 - 0.24 * t

    let x = WIDTH / 2 - total / 2 + w / 2
    for (let k = 0; k < count; k += 1) {
      if (k === side || k === side + middle) {
        x += aisle
      }
      const lean = (x - WIDTH / 2) / (WIDTH / 2)
      const y = rowY - lean * lean * 52 * scale
      const turn = -lean * 5
      seats.push({
        key: `${row}-${k}`,
        label: `${ROW_LETTERS.charAt(row)}${k + 1}`,
        transform: `translate(${n(x)} ${n(y)}) rotate(${turn.toFixed(2)})`,
        body,
        rim,
        stitch,
        fill,
        rimOpacity,
        fontSize: 15 * scale,
        labelY: -h * 0.6,
      })
      x += pitch
    }
  }

  return seats
}

const seats = buildSeats()

// lightRef is the room itself. The flashlight position is written onto it as --fx and --fy, so moving the
// light only restyles the room, not the form.
function Auditorium({ lightRef }: { lightRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="aud" aria-hidden="true" ref={lightRef}>
      <svg className="aud-seats" viewBox={`0 0 ${WIDTH} 900`} preserveAspectRatio="xMidYMax slice">
        {seats.map((s) => (
          <g key={s.key} transform={s.transform}>
            <path d={s.body} fill={s.fill} />
            <path d={s.rim} fill="none" stroke={`rgba(190, 215, 255, ${s.rimOpacity.toFixed(2)})`} strokeWidth="1.5" />
          </g>
        ))}
      </svg>

      <svg className="aud-seats aud-lit" viewBox={`0 0 ${WIDTH} 900`} preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="aud-velvet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9b1d28" />
            <stop offset="1" stopColor="#3a080d" />
          </linearGradient>
        </defs>
        {seats.map((s) => (
          <g key={s.key} transform={s.transform}>
            <path d={s.body} fill="url(#aud-velvet)" />
            <path d={s.stitch} fill="none" stroke="rgba(0, 0, 0, 0.35)" strokeWidth="1.2" />
            <path d={s.rim} fill="none" stroke="rgba(255, 190, 170, 0.5)" strokeWidth="1.5" />
            <text x="0" y={n(s.labelY)} fontSize={n(s.fontSize)} textAnchor="middle" fill="rgba(255, 234, 227, 0.72)" fontFamily="ui-monospace, Consolas, monospace" fontWeight="700">
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default memo(Auditorium)