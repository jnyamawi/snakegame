const snakes = {
  98: 40, 87: 49, 62: 19, 54: 34, 36: 17, 28: 10,
}

const ladders = {
  4: 25, 9: 31, 21: 42, 28: 55, 51: 67, 71: 91, 80: 99,
}

const tokenStyles = [
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-400',
]

function displayNumber(row, col) {
  const base = row * 10
  return row % 2 === 0 ? base + col + 1 : base + (10 - col)
}

function squareCenter(number) {
  const row = Math.floor((number - 1) / 10)
  const col = row % 2 === 0 ? (number - 1) % 10 : 9 - ((number - 1) % 10)
  return {
    x: col * 11 + 5,
    y: (9 - row) * 11 + 5,
  }
}

function ladderRails(start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy) || 1
  const offset = 1.8
  const ux = dx / length
  const uy = dy / length
  const px = -uy * offset
  const py = ux * offset

  return {
    left: { x1: start.x + px, y1: start.y + py, x2: end.x + px, y2: end.y + py },
    right: { x1: start.x - px, y1: start.y - py, x2: end.x - px, y2: end.y - py },
    rungCount: Math.max(3, Math.min(6, Math.floor(length / 8))),
    vector: { x: ux, y: uy },
  }
}

function buildPaths(map) {
  return Object.entries(map).map(([start, end]) => ({
    start: Number(start),
    end,
  }))
}

const snakePaths = buildPaths(snakes)
const ladderPaths = buildPaths(ladders)

export default function Board({ players = [], animatedPositions = {} }) {
  const cells = []
  const allPlayers = players.map((player) => ({
    ...player,
    displayPosition: animatedPositions[player.id] ?? player.position,
  }))
  for (let row = 9; row >= 0; row--) {
    for (let col = 0; col < 10; col++) {
      const number = displayNumber(row, col)
      const snake = snakes[number]
      const ladder = ladders[number]
      const occupants = allPlayers.filter((p) => p.displayPosition === number)

      cells.push(
        <div
          key={number}
          className={`relative aspect-square border border-white/10 p-1 ${
            number % 2 === 0 ? 'bg-white/[.045]' : 'bg-white/[.025]'
          }`}
        >
          <span className="absolute left-1 top-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-black text-slate-100 shadow-black/40 sm:text-[12px]">
            {number}
          </span>

          {snake && (
            <div className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] rounded-full bg-rose-500/15 px-1 py-0.5 text-[7px] leading-none font-semibold text-rose-200 shadow-sm ring-1 ring-rose-500/20 overflow-hidden whitespace-nowrap text-ellipsis sm:top-2 sm:px-2 sm:text-[10px]">
              <span className="font-black text-rose-100">S</span>
              <span className="mx-1 text-rose-300">→</span>
              <span className="text-rose-100">{snake}</span>
            </div>
          )}

          {ladder && (
            <div className="absolute right-1 top-1 max-w-[calc(100%-0.5rem)] rounded-full bg-emerald-500/15 px-1 py-0.5 text-[7px] leading-none font-semibold text-emerald-200 shadow-sm ring-1 ring-emerald-500/20 overflow-hidden whitespace-nowrap text-ellipsis sm:top-2 sm:px-2 sm:text-[10px]">
              <span className="font-black text-emerald-100">L</span>
              <span className="mx-1 text-emerald-300">→</span>
              <span className="text-emerald-100">{ladder}</span>
            </div>
          )}

          <div className="flex h-full items-center justify-center gap-0.5 pt-2">
            {occupants.map((player, i) => {
              const playerIndex = players.findIndex((p) => p.id === player.id)
              return (
                <div
                  key={player.id}
                  title={player.name}
                  className={`token-pop grid h-7 w-7 place-items-center rounded-full ${tokenStyles[playerIndex % tokenStyles.length]} text-[10px] font-black text-slate-950 ring-2 sm:h-8 sm:w-8`}
                >
                  {playerIndex + 1}
                </div>
              )
            })}
          </div>
        </div>,
      )
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl w-full max-w-[780px] mx-auto">
      <div className="pointer-events-none absolute inset-0 z-0">
        <svg viewBox="0 0 109 109" className="h-full w-full">
          {snakePaths.map(({ start, end }) => {
            const source = squareCenter(start)
            const target = squareCenter(end)
            return (
              <g key={`snake-${start}`} opacity="0.5">
                <path
                  d={`M ${source.x} ${source.y} C ${source.x} ${source.y + 18} ${target.x} ${target.y - 18} ${target.x} ${target.y}`}
                  stroke="#fb7185"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.18"
                />
                <path
                  d={`M ${source.x} ${source.y} C ${source.x} ${source.y + 18} ${target.x} ${target.y - 18} ${target.x} ${target.y}`}
                  stroke="#fb7185"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx={source.x} cy={source.y} r="1.8" fill="#fb7185" />
                <circle cx={target.x} cy={target.y} r="1" fill="#fb7185" />
              </g>
            )
          })}

          {ladderPaths.map(({ start, end }) => {
            const source = squareCenter(start)
            const target = squareCenter(end)
            const rails = ladderRails(source, target)
            const rungCount = rails.rungCount

            return (
              <g key={`ladder-${start}`} opacity="0.75">
                <line
                  x1={rails.left.x1}
                  y1={rails.left.y1}
                  x2={rails.left.x2}
                  y2={rails.left.y2}
                  stroke="#34d399"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <line
                  x1={rails.right.x1}
                  y1={rails.right.y1}
                  x2={rails.right.x2}
                  y2={rails.right.y2}
                  stroke="#34d399"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {Array.from({ length: rungCount }).map((_, index) => {
                  const t = (index + 1) / (rungCount + 1)
                  const x = source.x + rails.vector.x * 10 * t * 1.5
                  const y = source.y + rails.vector.y * 10 * t * 1.5
                  const rx = -rails.vector.y * 2.8
                  const ry = rails.vector.x * 2.8
                  return (
                    <line
                      key={index}
                      x1={x - rx}
                      y1={y - ry}
                      x2={x + rx}
                      y2={y + ry}
                      stroke="#34d399"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                  )
                })}
                <circle cx={source.x} cy={source.y} r="1.8" fill="#34d399" />
                <circle cx={target.x} cy={target.y} r="1" fill="#34d399" />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-10 gap-px relative z-10">{cells}</div>
    </div>
  )
}