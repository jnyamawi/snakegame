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

  return row % 2 === 0
    ? base + col + 1
    : base + (10 - col)
}

function squareCenter(number, measured) {
  const row = Math.floor((number - 1) / 10)

  const col =
    row % 2 === 0
      ? (number - 1) % 10
      : 9 - ((number - 1) % 10)

  if (
    !measured ||
    !measured.width ||
    !measured.height
  ) {
    return {
      x: col * 11 + 5,
      y: (9 - row) * 11 + 5,
    }
  }

  const gap = 1

  const totalGapX = gap * 9
  const totalGapY = gap * 9

  const cellW =
    (measured.width - totalGapX) / 10

  const cellH =
    (measured.height - totalGapY) / 10

  const cell = Math.min(
    cellW,
    cellH
  )

  const x =
    col * (cell + gap) +
    cell / 2

  const y =
    (9 - row) * (cell + gap) +
    cell / 2

  return {
    x,
    y,
  }
}

function ladderRails(
  start,
  end,
  unitScale = 1
) {
  const dx = end.x - start.x
  const dy = end.y - start.y

  const length =
    Math.hypot(dx, dy) || 1

  const offset =
    1.8 * unitScale

  const ux = dx / length
  const uy = dy / length

  const px = -uy * offset
  const py = ux * offset

  // compute rungCount in original "units"
  // so behavior matches regardless of pixel scale
  const lengthUnits =
    length / (unitScale || 1)

  return {
    left: {
      x1: start.x + px,
      y1: start.y + py,
      x2: end.x + px,
      y2: end.y + py,
    },

    right: {
      x1: start.x - px,
      y1: start.y - py,
      x2: end.x - px,
      y2: end.y - py,
    },

    rungCount: Math.max(
      3,
      Math.min(
        6,
        Math.floor(
          lengthUnits / 8
        )
      )
    ),

    vector: {
      x: ux,
      y: uy,
    },
  }
}

function buildPaths(map) {
  return Object.entries(map).map(
    ([start, end]) => ({
      start: Number(start),
      end,
    })
  )
}

const snakePaths =
  buildPaths(snakes)

const ladderPaths =
  buildPaths(ladders)

export default function Board({
  players = [],
  animatedPositions = {},
}) {
  const cells = []

  const allPlayers =
    players.map((player) => ({
      ...player,

      displayPosition:
        animatedPositions[player.id] ??
        player.position,
    }))

  const containerRef =
    useRef(null)

  const gridRef =
    useRef(null)

  const [size, setSize] =
    useState({
      width: 0,
      height: 0,
    })

  const [side, setSide] =
    useState(null)

  const [cellCenters, setCellCenters] =
    useState({})

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const el =
      containerRef.current

    const computeSide = (rect) => {
      const mobileControls =
        document.querySelector(
          '.mobile-controls'
        )

      const mobileH =
        mobileControls
          ? mobileControls
              .getBoundingClientRect()
              .height
          : 0

      const availableHeight =
        Math.max(
          0,
          window.innerHeight -
            rect.top -
            mobileH -
            12
        )

      return Math.floor(
        Math.min(
          rect.width,
          availableHeight
        )
      )
    }

    const ro =
      new ResizeObserver(() => {
        const rect =
          el.getBoundingClientRect()

        setSize({
          width: Math.max(
            0,
            rect.width
          ),
          height: Math.max(
            0,
            rect.height
          ),
        })

        setSide(
          computeSide(rect)
        )

        if (gridRef.current) {
          const children =
            Array.from(
              gridRef.current.children
            )

          const containerRect =
            el.getBoundingClientRect()

          const centers = {}

          children.forEach(
            (child, idx) => {
              const r =
                child.getBoundingClientRect()

              const left =
                r.left -
                containerRect.left

              const top =
                r.top -
                containerRect.top

              const cx =
                left + r.width / 2

              const cy =
                top + r.height / 2

              const row =
                9 -
                Math.floor(
                  idx / 10
                )

              const col =
                idx % 10

              const number =
                displayNumber(
                  row,
                  col
                )

              centers[number] = {
                x: cx,
                y: cy,
                w: r.width,
                h: r.height,
              }
            }
          )

          setCellCenters(
            centers
          )
        }
      })

    ro.observe(el)

    const rect =
      el.getBoundingClientRect()

    setSize({
      width: Math.max(
        0,
        rect.width
      ),
      height: Math.max(
        0,
        rect.height
      ),
    })

    setSide(
      computeSide(rect)
    )

    const onResize = () => {
      if (!containerRef.current) {
        return
      }

      const r =
        containerRef.current
          .getBoundingClientRect()

      setSide(
        computeSide(r)
      )
    }

    window.addEventListener(
      'resize',
      onResize
    )

    return () => {
      ro.disconnect()

      window.removeEventListener(
        'resize',
        onResize
      )
    }
  }, [])

  // ============================================================
  // CREATE BOARD CELLS
  // ============================================================

  for (
    let row = 9;
    row >= 0;
    row--
  ) {
    for (
      let col = 0;
      col < 10;
      col++
    ) {
      const number =
        displayNumber(
          row,
          col
        )

      const snake =
        snakes[number]

      const ladder =
        ladders[number]

      const occupants =
        allPlayers.filter(
          (p) =>
            p.displayPosition ===
            number
        )

      cells.push(
        <div
          key={number}
          className={`relative aspect-square border border-white/10 p-0.5 ${
            number % 2 === 0
              ? 'bg-white/[.045]'
              : 'bg-white/[.025]'
          }`}
        >
          {/* NUMBER */}
          <span
            className="
              absolute
              left-1
              top-1
              rounded-full
              bg-slate-950/80
              px-2
              py-0.5
              text-[9px]
              font-black
              text-slate-100
              shadow-black/40
              sm:text-[12px]
            "
          >
            {number}
          </span>

          {/* SNAKE INDICATOR */}
          {snake && (
            <div
              className="
                absolute
                left-1
                top-1
                max-w-[calc(100%-0.5rem)]
                overflow-hidden
                whitespace-nowrap
                rounded-full
                bg-rose-500/15
                px-1
                py-0.5
                text-[7px]
                font-semibold
                leading-none
                text-rose-200
                shadow-sm
                ring-1
                ring-rose-500/20
                text-ellipsis
                sm:top-2
                sm:px-2
                sm:text-[10px]
              "
            >
              <span className="font-black text-rose-100">
                S
              </span>

              <span className="mx-1 text-rose-300">
                →
              </span>

              <span className="text-rose-100">
                {snake}
              </span>
            </div>
          )}

          {/* LADDER INDICATOR */}
          {ladder && (
            <div
              className="
                absolute
                right-1
                top-1
                max-w-[calc(100%-0.5rem)]
                overflow-hidden
                whitespace-nowrap
                rounded-full
                bg-emerald-500/15
                px-1
                py-0.5
                text-[7px]
                font-semibold
                leading-none
                text-emerald-200
                shadow-sm
                ring-1
                ring-emerald-500/20
                text-ellipsis
                sm:top-2
                sm:px-2
                sm:text-[10px]
              "
            >
              <span className="font-black text-emerald-100">
                L
              </span>

              <span className="mx-1 text-emerald-300">
                →
              </span>

              <span className="text-emerald-100">
                {ladder}
              </span>
            </div>
          )}

          {/* PLAYER TOKENS */}
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              gap-0.5
              pt-2
            "
          >
            {occupants.map(
              (player) => {
                const playerIndex =
                  players.findIndex(
                    (p) =>
                      p.id ===
                      player.id
                  )

                return (
                  <div
                    key={
                      player.id
                    }
                    title={
                      player.name
                    }
                    className={`
                      token-pop
                      grid
                      h-6
                      w-6
                      place-items-center
                      rounded-full
                      ${
                        tokenStyles[
                          playerIndex %
                            tokenStyles.length
                        ]
                      }
                      text-[9px]
                      font-black
                      text-slate-950
                      ring-2
                      sm:h-7
                      sm:w-7
                    `}
                  >
                    {playerIndex + 1}
                  </div>
                )
              }
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div
      ref={containerRef}
      className="
        relative
        mx-auto
        w-full
        max-w-[780px]
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-slate-950/80
        shadow-2xl
      "
      style={{
        width: side
          ? `${side}px`
          : 'min(100%, calc(100vh - 22rem))',

        height: side
          ? `${side}px`
          : 'min(100vw, calc(100vh - 22rem))',

        maxWidth: '780px',

        paddingBottom:
          '0.5rem',

        boxSizing:
          'border-box',
      }}
    >
      {/* ========================================================
          SNAKES + LADDERS SVG
          ======================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
        "
      >
        <svg
          viewBox={`0 0 ${
            size.width || 109
          } ${
            size.height || 109
          }`}
          className="
            h-full
            w-full
          "
        >
          {(() => {
            const gap = 1

            const totalGapX =
              gap * 9

            const totalGapY =
              gap * 9

            const cellW =
              (size.width -
                totalGapX) /
                10 || 11

            const cellH =
              (size.height -
                totalGapY) /
                10 || 11

            const cell =
              Math.min(
                cellW,
                cellH
              )

            const unitScale =
              cell / 11 || 1

            const controlOffset =
              18 * unitScale

            const rungBase =
              10 *
              unitScale *
              1.5

            const rxBase =
              2.8 *
              unitScale

            return (
              <>
                {/* ==================================================
                    SNAKES
                    ================================================== */}

                {snakePaths.map(
                  ({
                    start,
                    end,
                  }) => {
                    const source =
                      cellCenters[
                        start
                      ] ??
                      squareCenter(
                        start,
                        size
                      )

                    const target =
                      cellCenters[
                        end
                      ] ??
                      squareCenter(
                        end,
                        size
                      )

                    return (
                      <g
                        key={`snake-${start}`}
                        opacity="0.5"
                      >
                        <path
                          d={`
                            M ${source.x}
                              ${source.y}

                            C
                            ${source.x}
                              ${
                                source.y +
                                controlOffset
                              }

                            ${
                              target.x
                            }
                              ${
                                target.y -
                                controlOffset
                              }

                            ${
                              target.x
                            }
                              ${
                                target.y
                              }
                          `}
                          stroke="#fb7185"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          opacity="0.18"
                        />

                        <path
                          d={`
                            M ${source.x}
                              ${source.y}

                            C
                            ${source.x}
                              ${
                                source.y +
                                controlOffset
                              }

                            ${
                              target.x
                            }
                              ${
                                target.y -
                                controlOffset
                              }

                            ${
                              target.x
                            }
                              ${
                                target.y
                              }
                          `}
                          stroke="#fb7185"
                          strokeWidth="1.8"
                          fill="none"
                          strokeLinecap="round"
                        />

                        <circle
                          cx={
                            source.x
                          }
                          cy={
                            source.y
                          }
                          r="1.8"
                          fill="#fb7185"
                        />

                        <circle
                          cx={
                            target.x
                          }
                          cy={
                            target.y
                          }
                          r="1"
                          fill="#fb7185"
                        />
                      </g>
                    )
                  }
                )}

                {/* ==================================================
                    LADDERS
                    ORIGINAL LADDER IMPLEMENTATION PRESERVED
                    ================================================== */}

                {ladderPaths.map(
                  ({
                    start,
                    end,
                  }) => {
                    const source =
                      cellCenters[
                        start
                      ] ??
                      squareCenter(
                        start,
                        size
                      )

                    const target =
                      cellCenters[
                        end
                      ] ??
                      squareCenter(
                        end,
                        size
                      )

                    const localCellW =
                      (size.width -
                        1 * 9) /
                        10 || 11

                    const unitScaleLocal =
                      (
                        cellCenters[
                          start
                        ]?.w ??
                        localCellW
                      ) /
                        11 ||
                      1

                    const rails =
                      ladderRails(
                        source,
                        target,
                        unitScaleLocal
                      )

                    const rungCount =
                      rails.rungCount

                    return (
                      <g
                        key={`ladder-${start}`}
                        opacity="0.75"
                      >
                        <line
                          x1={
                            rails.left
                              .x1
                          }
                          y1={
                            rails.left
                              .y1
                          }
                          x2={
                            rails.left
                              .x2
                          }
                          y2={
                            rails.left
                              .y2
                          }
                          stroke="#34d399"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />

                        <line
                          x1={
                            rails.right
                              .x1
                          }
                          y1={
                            rails.right
                              .y1
                          }
                          x2={
                            rails.right
                              .x2
                          }
                          y2={
                            rails.right
                              .y2
                          }
                          stroke="#34d399"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />

                        {Array.from({
                          length:
                            rungCount,
                        }).map(
                          (
                            _,
                            index
                          ) => {
                            const t =
                              (index +
                                1) /
                              (rungCount +
                                1)

                            const x =
                              source.x +
                              rails
                                .vector
                                .x *
                                rungBase *
                                t

                            const y =
                              source.y +
                              rails
                                .vector
                                .y *
                                rungBase *
                                t

                            const rx =
                              -rails
                                .vector
                                .y *
                              rxBase

                            const ry =
                              rails
                                .vector
                                .x *
                              rxBase

                            return (
                              <line
                                key={
                                  index
                                }
                                x1={
                                  x -
                                  rx
                                }
                                y1={
                                  y -
                                  ry
                                }
                                x2={
                                  x +
                                  rx
                                }
                                y2={
                                  y +
                                  ry
                                }
                                stroke="#34d399"
                                strokeWidth="1.1"
                                strokeLinecap="round"
                              />
                            )
                          }
                        )}

                        <circle
                          cx={
                            source.x
                          }
                          cy={
                            source.y
                          }
                          r="1.8"
                          fill="#34d399"
                        />

                        <circle
                          cx={
                            target.x
                          }
                          cy={
                            target.y
                          }
                          r="1"
                          fill="#34d399"
                        />
                      </g>
                    )
                  }
                )}
              </>
            )
          })()}
        </svg>
      </div>

      {/* ========================================================
          BOARD GRID
          ======================================================== */}

      <div
        ref={gridRef}
        className="
          relative
          z-10
          grid
          grid-cols-10
          gap-px
        "
      >
        {cells}
      </div>
    </div>
  )
}