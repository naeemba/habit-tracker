// A faint habit heatmap behind the sign-in card: rounded squares in a few
// shades, like a streak calendar. One tile repeats across the page; the mask
// fades it out behind the card so the form stays easy to read.

// Cells per side of the square tile.
const SIZE = 24
const CELL = 22
const GAP = 6
const STEP = CELL + GAP
// Mostly empty days, a few done, a rare bright one.
const SHADES = [0.05, 0.05, 0.05, 0.05, 0.05, 0.1, 0.1, 0.1, 0.18, 0.18, 0.3, 0.45]

// A fixed hash, not Math.random, so the server and the browser draw the same
// squares. Without the scramble a small tile repeats in visible bands.
function shadeAt(column: number, row: number) {
  let hash = (column * 374761393 + row * 668265263) | 0
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return SHADES[((hash ^ (hash >>> 16)) >>> 0) % SHADES.length]
}

const cells = Array.from({ length: SIZE * SIZE }, (_, index) => {
  const column = index % SIZE
  const row = Math.floor(index / SIZE)
  return { x: column * STEP + GAP / 2, y: row * STEP + GAP / 2, shade: shadeAt(column, row) }
})

export function HabitGrid() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-10 text-violet-300"
      style={{
        maskImage: "radial-gradient(ellipse at center, transparent 20%, black 75%)",
      }}
    >
      <defs>
        <pattern id="habit-grid" width={SIZE * STEP} height={SIZE * STEP} patternUnits="userSpaceOnUse">
          {cells.map(({ x, y, shade }, index) => (
            <rect key={index} x={x} y={y} width={CELL} height={CELL} rx={5} fill="currentColor" fillOpacity={shade} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#habit-grid)" />
    </svg>
  )
}
