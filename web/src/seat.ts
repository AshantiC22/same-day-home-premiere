// The seat a viewer picks when they sign up. It is only remembered in this browser:
// the API has no place to keep it yet (same as the "Full Name" box).
const KEY = 'sdp-seat'

export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E']
export const SEATS_PER_ROW = 8

// "C4" is a seat. "Z9" and "hello" are not.
export function isSeat(value: string): boolean {
  const row = value.charAt(0)
  const number = Number(value.slice(1))
  return SEAT_ROWS.includes(row) && Number.isInteger(number) && number >= 1 && number <= SEATS_PER_ROW
}

export function readSeat(): string | null {
  try {
    const value = window.localStorage.getItem(KEY)
    return value !== null && isSeat(value) ? value : null
  } catch {
    // Private windows can block storage. No saved seat is fine.
    return null
  }
}

export function saveSeat(value: string): void {
  if (!isSeat(value)) {
    return
  }
  try {
    window.localStorage.setItem(KEY, value)
  } catch {
    // Not saved. The seat still shows for this visit.
  }
}