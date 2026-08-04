import { useEffect, useRef, useState } from 'react'

const snakes = {
  98: 40,
  87: 49,
  62: 19,
  54: 34,
  36: 17,
  28: 10,
}

const ladders = {
  4: 25,
  9: 31,
  21: 42,
  28: 55,
  51: 67,
  71: 91,
  80: 99,
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

function squareCenter(number, measured) {
  const row = Math.floor((number - 1) / 10)
  const col = row % 2 === 0 ? (number - 1) % 10 : 9 - ((number - 1) % 10)

  if (!measured || !measured.width || !measured.height) {
    return { x: col * 11 + 5, y: (9 - row) * 11 + 5 }
  }

  const gap = 1
  const totalGapX = gap * 9
  const totalGapY = gap * 9
  const cellW = (measured.width - totalGapX) / 10
  const cellH = (measured.height - totalGapY) / 10
  const cell = Math.min(cellW, cellH)

  return {
    x: col * (cell + gap) + cell / 2,
    y: (9 - row) * (cell + gap) + cell / 2,
  }
}

function ladderRails(start, end, unitScale = 1) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy) || 1
  const offset = 2.6 * unitScale
  const ux = dx / length
  const uy = dy / length
  const px = -uy * offset
  const py = ux * offset
  const lengthUnits = length / (unitScale || 1)

  return {
    left: { x1: start.x + px, y1: start.y + py, x2: end.x + px, y2: end.y + py },
    right: { x1: start.x - px, y1: start.y - py, x2: end.x - px, y2: end.y - py },
    rungCount: Math.max(3, Math.min(6, Math.floor(lengthUnits / 8))),
    vector: { x: ux, y: uy },
  }
}

function buildPaths(map) {
  return Object.entries(map).map(([start, end]) => ({ start: Number(start), end }))
}

const snakePaths = buildPaths(snakes)
const ladderPaths = buildPaths(ladders)

export default function Board({ players = [], animatedPositions = {} }) {
  const containerRef = useRef(null)
  const gridRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [cellCenters, setCellCenters] = useState({})
  const boardReady = Object.keys(cellCenters).length === 100

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    const updateMeasurements = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: Math.max(0, rect.width), height: Math.max(0, rect.height) })
    }

    updateMeasurements()
    const observer = new ResizeObserver(updateMeasurements)
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!containerRef.current || !gridRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const centers = {}

    Array.from(gridRef.current.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect()
      const left = rect.left - containerRect.left
      const top = rect.top - containerRect.top
      const cx = left + rect.width / 2
      const cy = top + rect.height / 2
      const row = 9 - Math.floor(index / 10)
      const col = index % 10
      const number = displayNumber(row, col)
      centers[number] = { x: cx, y: cy, w: rect.width, h: rect.height }
    })

    setCellCenters(centers)
  }, [size.width, size.height])

  const allPlayers = players.map((player) => ({
    ...player,
    displayPosition: animatedPositions[player.id] ?? player.position,
  }))

  const boardWidth = size.width || 320
  const snakeControlOffset = Math.max(24, boardWidth / 14)
  const snakeBaseStroke = Math.max(3.5, boardWidth / 130)
  const snakeGlowStroke = Math.max(8, boardWidth / 40)
  const ladderRailStroke = Math.max(2.4, boardWidth / 220)
  const ladderRungStroke = Math.max(1.6, boardWidth / 240)
  const ladderRungSpacing = Math.max(16, boardWidth / 23)

  const cells = []
  for (let row = 9; row >= 0; row--) {
    for (let col = 0; col < 10; col++) {
      const number = displayNumber(row, col)
      const snake = snakes[number]
      const ladder = ladders[number]
      const occupants = allPlayers.filter((p) => p.displayPosition === number)

      cells.push(
        <div
          key={number}
          className={`relative aspect-square border border-white/10 p-0.5 ${
            number % 2 === 0 ? 'bg-white/[.045]' : 'bg-white/[.025]'
          }`}
        >
          <span className="absolute left-1 top-1 rounded-full bg-slate-950/90 px-2 py-0.5 text-[10px] font-black text-slate-100 shadow-black/40 sm:text-[13px]">
            {number}
          </span>

          {snake && (
            <div className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] rounded-full bg-rose-500/18 px-1 py-0.5 text-[8px] leading-none font-semibold text-rose-100 shadow-sm ring-1 ring-rose-500/25 overflow-hidden whitespace-nowrap text-ellipsis sm:top-2 sm:px-2 sm:text-[11px]">
              <span className="font-black text-rose-100">S</span>
              <span className="mx-1 text-rose-300">→</span>
              <span className="text-rose-100">{snake}</span>
            </div>
          )}

          {ladder && (
            <div className="absolute right-1 top-1 max-w-[calc(100%-0.5rem)] rounded-full bg-emerald-500/18 px-1 py-0.5 text-[8px] leading-none font-semibold text-emerald-100 shadow-sm ring-1 ring-emerald-500/25 overflow-hidden whitespace-nowrap text-ellipsis sm:top-2 sm:px-2 sm:text-[11px]">
              <span className="font-black text-emerald-100">L</span>
              <span className="mx-1 text-emerald-300">→</span>
              <span className="text-emerald-100">{ladder}</span>
            </div>
          )}

          <div className="flex h-full items-center justify-center gap-0.5 pt-2">
            {occupants.map((player) => {
              const playerIndex = players.findIndex((p) => p.id === player.id)
              return (
                <div
                  key={player.id}
                  title={player.name}
                  className={`token-pop grid h-6 w-6 place-items-center rounded-full ${tokenStyles[playerIndex % tokenStyles.length]} text-[9px] font-black text-slate-950 ring-2 sm:h-7 sm:w-7`}
                >
                  {playerIndex + 1}
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

   return (
    <div className="w-full flex justify-center px-2 sm:px-4">
        <div
            ref={containerRef}
            className="
                relative
                w-full
                max-w-[820px]
                aspect-square
                rounded-2xl
                overflow-hidden
                border
                border-white/10
                bg-slate-950/80
                shadow-2xl
                select-none
                touch-none
                mx-auto
            "
        >
      <div className="absolute inset-0 pointer-events-none z-0">
    <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${size.width || 100} ${size.height || 100}`}
        preserveAspectRatio="none"
    >
      {boardReady && (
        <>

          {snakePaths.map(({ start, end }) => {
           const source = cellCenters[start]
const target = cellCenters[end]

if (!source || !target) return null
            return (
              <g key={`snake-${start}`} opacity="0.95">
                <path
                  d={`M ${source.x} ${source.y} C ${source.x} ${source.y + snakeControlOffset} ${target.x} ${target.y - snakeControlOffset} ${target.x} ${target.y}`}
                  stroke="#fb7185"
                  strokeWidth={snakeGlowStroke}
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.18"
                />
                <path
                  d={`M ${source.x} ${source.y} C ${source.x} ${source.y + snakeControlOffset} ${target.x} ${target.y - snakeControlOffset} ${target.x} ${target.y}`}
                  stroke="#fb7185"
                  strokeWidth={snakeBaseStroke}
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx={source.x} cy={source.y} r={snakeBaseStroke * 0.9} fill="#fb7185" />
                <circle cx={target.x} cy={target.y} r={snakeBaseStroke * 0.6} fill="#fb7185" />
              </g>
            )
          })}

          {ladderPaths.map(({ start, end }) => {
            const source = cellCenters[start]
const target = cellCenters[end]

if (!source || !target) return null
            const rails = ladderRails(source, target)
            return (
              <g key={`ladder-${start}`} opacity="0.98">
                <line
                  x1={rails.left.x1}
                  y1={rails.left.y1}
                  x2={rails.left.x2}
                  y2={rails.left.y2}
                  stroke="#34d399"
                  strokeWidth={ladderRailStroke}
                  strokeLinecap="round"
                />
                <line
                  x1={rails.right.x1}
                  y1={rails.right.y1}
                  x2={rails.right.x2}
                  y2={rails.right.y2}
                  stroke="#34d399"
                  strokeWidth={ladderRailStroke}
                  strokeLinecap="round"
                />
                {Array.from({ length: rails.rungCount }).map((_, index) => {
                  const t = (index + 1) / (rails.rungCount + 1)
                  const distance = rails.length * t

const x = source.x + rails.vector.x * distance
const y = source.y + rails.vector.y * distance
                  const rx = -rails.vector.y * (ladderRungStroke * 2.1)
                  const ry = rails.vector.x * (ladderRungStroke * 2.1)
                  return (
                    <line
                      key={index}
                      x1={x - rx}
                      y1={y - ry}
                      x2={x + rx}
                      y2={y + ry}
                      stroke="#34d399"
                      strokeWidth={ladderRungStroke}
                      strokeLinecap="round"
                    />
                  )
                })}
                <circle cx={source.x} cy={source.y} r={ladderRailStroke * 1.1} fill="#34d399" />
                <circle cx={target.x} cy={target.y} r={ladderRailStroke * 0.9} fill="#34d399" />
              </g>
            )
          })}
      
    </>
      )}
    </svg>
      </div>

      <div
    ref={gridRef}
    className="
        absolute
        inset-0
        grid
        grid-cols-10
        grid-rows-10
        gap-px
        z-10
    "
>

        {cells}
      </div>
    </div>
    </div>
  )
}
