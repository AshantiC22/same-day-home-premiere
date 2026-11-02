import { useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'

type TicketField = { label: string; value: string }

type TicketProps = {
  title: string
  fields: TicketField[]
  // The premiere's number. It is printed on the stub and decides the barcode, so every premiere prints its own.
  serial: number
  // Fine print along the bottom of the ticket.
  note?: string
  // true while the ticket is being checked: a scan line sweeps across the stub.
  scanning?: boolean
  // true for the picture of a ticket on the home page. Screen readers skip it.
  decorative?: boolean
  // The price and the button, printed along the bottom.
  children?: ReactNode
}

// A small seeded random number generator, so the same premiere always prints the same barcode.
function seededRandom(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Bars of different widths with gaps between them, along a line that is 120 units long.
function makeBars(seed: number): { at: number; size: number }[] {
  const next = seededRandom(seed)
  const bars: { at: number; size: number }[] = []
  let at = 0
  while (at < 117) {
    const size = 1 + Math.floor(next() * 3)
    bars.push({ at, size })
    at += size + 1 + Math.floor(next() * 3)
  }
  return bars
}

// Two drawings of the same barcode. The stub shows one standing up, and on a phone the other lies down.
function Barcode({ seed }: { seed: number }) {
  const bars = makeBars(seed)
  return (
    <>
      <svg className="ticket-bars ticket-bars-v" viewBox="0 0 40 120" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
        {bars.map((b) => (
          <rect key={b.at} x="0" y={b.at} width="40" height={b.size} />
        ))}
      </svg>
      <svg className="ticket-bars ticket-bars-h" viewBox="0 0 120 40" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
        {bars.map((b) => (
          <rect key={b.at} x={b.at} y="0" width={b.size} height="40" />
        ))}
      </svg>
    </>
  )
}

function Ticket({ title, fields, serial, note, scanning = false, decorative = false, children }: TicketProps) {
  const ref = useRef<HTMLElement>(null)

  // A mouse over the ticket tilts it a little and moves a highlight across the paper. A finger does nothing.
  function handleMove(e: PointerEvent<HTMLElement>) {
    const el = ref.current
    if (el === null || e.pointerType !== 'mouse') {
      return
    }
    const box = el.getBoundingClientRect()
    const x = (e.clientX - box.left) / box.width
    const y = (e.clientY - box.top) / box.height
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
    el.style.setProperty('--tilt-x', `${((0.5 - y) * 4).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${((x - 0.5) * 5).toFixed(2)}deg`)
  }

  function handleLeave() {
    const el = ref.current
    if (el === null) {
      return
    }
    for (const name of ['--mx', '--my', '--tilt-x', '--tilt-y']) {
      el.style.removeProperty(name)
    }
  }

  return (
    <div className={decorative ? 'ticket-wrap is-decorative' : 'ticket-wrap'} aria-hidden={decorative ? true : undefined}>
      <article
        ref={ref}
        className={scanning ? 'ticket is-scanning' : 'ticket'}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <span className="ticket-sheen" aria-hidden="true" />

        <div className="ticket-main">
          <div className="ticket-top">
            <span>Same Day Premiere</span>
            <span>Admit one</span>
          </div>

          <h3 className="ticket-title">{title}</h3>

          <dl className="ticket-fields">
            {fields.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>

          {note !== undefined && <p className="ticket-note">{note}</p>}
          {children !== undefined && <div className="ticket-foot">{children}</div>}
        </div>

        <div className="ticket-stub" aria-hidden="true">
          <span className="ticket-stub-label">Admit one</span>
          <Barcode seed={serial} />
          <span className="ticket-serial">No. {String(serial).padStart(4, '0')}</span>
        </div>
      </article>
    </div>
  )
}

export default Ticket