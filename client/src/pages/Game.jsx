import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Dices,
  LogOut,
  RotateCcw,
  Trophy,
  Wifi,
  WifiOff,
} from 'lucide-react'

import RoomHeader from '../components/RoomHeader'
import Board from '../components/Board'
import Dice from '../components/Dice'
import PlayerList from '../components/PlayerList'
import { socket } from '../socket/socket'
import {
  getPlayer,
  savePlayer,
  clearPlayer,
} from '../utils/storage'

const SNAKES = {
  98: 40,
  87: 49,
  62: 19,
  54: 34,
  36: 17,
  28: 10,
}

const LADDERS = {
  4: 25,
  9: 31,
  21: 42,
  28: 55,
  51: 67,
  71: 91,
  80: 99,
}

export default function Game() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const player = getPlayer()

  const [room, setRoom] = useState(null)
  const [connected, setConnected] = useState(
    socket.connected
  )
  const [notice, setNotice] = useState('')
  const [dice, setDice] = useState(null)
  const [animatedPositions, setAnimatedPositions] =
    useState({})

  const prevRoomRef = useRef(null)
  const animationTimeouts = useRef([])

  // ============================================================
  // CLEAR MOVEMENT ANIMATION TIMEOUTS
  // ============================================================

  const clearAnimationTimeouts = () => {
    animationTimeouts.current.forEach((id) =>
      clearTimeout(id)
    )

    animationTimeouts.current = []
  }

  // ============================================================
  // GET MOVEMENT STEPS
  // ============================================================

  const getMovementSteps = (
    fromPosition,
    toPosition,
    dice
  ) => {
    const steps = [fromPosition]

    const target = Number.isInteger(dice)
      ? fromPosition + dice <= 100
        ? fromPosition + dice
        : fromPosition
      : toPosition

    if (target !== fromPosition) {
      for (
        let pos = fromPosition + 1;
        pos <= target;
        pos += 1
      ) {
        steps.push(pos)
      }

      const jump =
        LADDERS[target] ??
        SNAKES[target]

      if (jump && jump !== target) {
        steps.push(jump)
      }
    }

    if (
      steps[steps.length - 1] !==
      toPosition
    ) {
      steps.push(toPosition)
    }

    return steps
  }

  // ============================================================
  // ANIMATE PLAYER MOVEMENT
  // ============================================================

  const animateMovement = (
    playerId,
    fromPosition,
    toPosition,
    diceValue
  ) => {
    if (
      fromPosition ===
      toPosition
    ) {
      return
    }

    clearAnimationTimeouts()

    const steps =
      getMovementSteps(
        fromPosition,
        toPosition,
        diceValue
      )

    setAnimatedPositions(
      (current) => ({
        ...current,
        [playerId]:
          steps[0],
      })
    )

    steps
      .slice(1)
      .forEach(
        (
          position,
          index
        ) => {
          const timeout =
            window.setTimeout(
              () => {
                setAnimatedPositions(
                  (current) => ({
                    ...current,
                    [playerId]:
                      position,
                  })
                )
              },
              (index + 1) * 280
            )

          animationTimeouts.current.push(
            timeout
          )
        }
      )

    const cleanup =
      window.setTimeout(
        () => {
          setAnimatedPositions(
            (current) => {
              const next = {
                ...current,
              }

              delete next[
                playerId
              ]

              return next
            }
          )
        },
        steps.length * 280 + 120
      )

    animationTimeouts.current.push(
      cleanup
    )
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      clearAnimationTimeouts()
    }
  }, [])

  // ============================================================
  // SOCKET EVENTS
  // ============================================================

  useEffect(() => {
    if (!player) {
      navigate('/')
      return
    }

    if (
      player.roomId !== roomId
    ) {
      savePlayer({
        ...player,
        roomId,
      })
    }

    const onConnect = () => {
      setConnected(true)

      socket.emit(
        'rejoin-room',
        {
          roomId,
          playerId:
            player.id,
          name: player.name,
        }
      )
    }

    const onDisconnect = () => {
      setConnected(false)
    }

    const onState = (state) => {
      const previousRoom =
        prevRoomRef.current

      setRoom(state)

      if (
        previousRoom?.players &&
        state.lastMove?.playerId
      ) {
        const movedPlayer =
          state.players.find(
            (p) =>
              p.id ===
              state.lastMove
                .playerId
          )

        const previousPlayer =
          previousRoom.players.find(
            (p) =>
              p.id ===
              state.lastMove
                .playerId
          )

        if (
          movedPlayer &&
          previousPlayer &&
          movedPlayer.position !==
            previousPlayer.position
        ) {
          animateMovement(
            state.lastMove
              .playerId,
            previousPlayer.position,
            movedPlayer.position,
            state.lastMove
              .dice
          )
        }
      }

      if (
        state.lastMove
          ?.playerId ===
        player.id
      ) {
        setDice(
          state.lastMove.dice
        )

        if (
          state.lastMove.message
        ) {
          setNotice(
            state.lastMove.message
          )

          setTimeout(
            () =>
              setNotice(''),
            3000
          )
        }
      }

      prevRoomRef.current =
        state
    }

    const onGameEvent = ({
      message,
      dice: rolled,
    }) => {
      if (rolled) {
        setDice(rolled)
      }

      if (message) {
        setNotice(message)

        setTimeout(
          () =>
            setNotice(''),
          3000
        )
      }
    }

    const onError = ({
      message,
    }) => {
      setNotice(message)

      setTimeout(
        () =>
          setNotice(''),
        3000
      )
    }

    const onRoomClosed = ({
      message,
    }) => {
      if (message) {
        setNotice(message)
      }

      setTimeout(
        () =>
          setNotice(''),
        3000
      )

      navigate('/')
    }

    socket.on(
      'connect',
      onConnect
    )

    socket.on(
      'disconnect',
      onDisconnect
    )

    socket.on(
      'room-state',
      onState
    )

    socket.on(
      'game-event',
      onGameEvent
    )

    socket.on(
      'room-error',
      onError
    )

    socket.on(
      'room-closed',
      onRoomClosed
    )

    if (!socket.connected) {
      socket.connect()
    } else {
      socket.emit(
        'rejoin-room',
        {
          roomId,
          playerId:
            player.id,
          name: player.name,
        }
      )
    }

    return () => {
      socket.off(
        'connect',
        onConnect
      )

      socket.off(
        'disconnect',
        onDisconnect
      )

      socket.off(
        'room-state',
        onState
      )

      socket.off(
        'game-event',
        onGameEvent
      )

      socket.off(
        'room-error',
        onError
      )

      socket.off(
        'room-closed',
        onRoomClosed
      )
    }
  }, [roomId])

  // ============================================================
  // GAME STATE
  // ============================================================

  const [
    scoreboardOpen,
    setScoreboardOpen,
  ] = useState(true)

  const me = useMemo(
    () =>
      room?.players?.find(
        (p) =>
          p.id ===
          player?.id
      ),
    [room, player?.id]
  )

  const isMyTurn =
    room?.status ===
      'playing' &&
    room?.currentTurn ===
      player?.id

  // ============================================================
  // ACTIONS
  // ============================================================

  const roll = () => {
    socket.emit(
      'roll-dice',
      {
        roomId,
        playerId:
          player.id,
      }
    )
  }

  const leave = () => {
    socket.emit(
      'leave-room',
      {
        roomId,
        playerId:
          player.id,
      }
    )

    clearPlayer()

    navigate('/')
  }

  const closeRoom = () => {
    if (!player) return

    socket.emit(
      'close-room',
      {
        roomId,
        playerId:
          player.id,
      }
    )
  }

  const rematch = () =>
    socket.emit(
      'rematch',
      {
        roomId,
        playerId:
          player.id,
      }
    )

  // ============================================================
  // LOADING
  // ============================================================

  if (!room) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        Loading game…
      </div>
    )
  }

  const winner =
    room.players.find(
      (p) =>
        p.id ===
        room.winner
    )

  const sortedPlayers = [
    ...room.players,
  ].sort(
    (a, b) =>
      (b.wins ?? 0) -
      (a.wins ?? 0)
  )

  // ============================================================
  // GAME PAGE
  // ============================================================

  return (
    <main className="min-h-screen overflow-x-hidden pb-6 lg:pb-0">
      <RoomHeader
        roomId={roomId}
        isHost={
          player?.id ===
          room.host
        }
        onClose={closeRoom}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-3 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_350px]">
        {/* ======================================================
            MAIN GAME SECTION
            ====================================================== */}

        <section className="min-w-0">
          {/* HEADER */}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Live Match
              </div>

              <h1 className="text-2xl font-black sm:text-3xl">
                Snake & Ladder
              </h1>
            </div>

            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                connected
                  ? 'bg-emerald-400/10 text-emerald-300'
                  : 'bg-rose-400/10 text-rose-300'
              }`}
            >
              {connected ? (
                <Wifi size={14} />
              ) : (
                <WifiOff size={14} />
              )}

              {connected
                ? 'Connected'
                : 'Reconnecting…'}
            </div>
          </div>

          {/* ====================================================
              FULL BOARD
              ==================================================== */}

          <div className="w-full">
            <Board
              players={
                room.players
              }
              animatedPositions={
                animatedPositions
              }
            />
          </div>

          {/* ====================================================
              MOBILE CONTROLS

              IMPORTANT:
              These used to be FIXED at the bottom of
              the screen. That caused them to cover
              squares 1-20 on mobile.

              They are now a normal block BELOW the board.
              ==================================================== */}

          <div className="
  mobile-controls
  lg:hidden
  relative
  mt-4
  w-full
">
            <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                {/* TURN INFORMATION */}

                <div
                  className={`min-w-0 flex-1 rounded-2xl px-3 py-2 text-sm font-semibold ${
                    room.status ===
                    'finished'
                      ? 'bg-amber-500/15 text-amber-200'
                      : isMyTurn
                        ? 'bg-indigo-500/15 text-indigo-100'
                        : 'bg-white/[.04] text-slate-400'
                  }`}
                >
                  <div className="truncate text-[10px] uppercase tracking-widest text-slate-500">
                    {room.status ===
                    'finished'
                      ? 'Game over'
                      : isMyTurn
                        ? 'Your turn'
                        : 'Waiting'}
                  </div>

                  <div className="mt-1 text-sm font-black leading-tight text-white">
                    {room.status ===
                    'finished'
                      ? `🏆 ${
                          winner?.name ??
                          'Player'
                        } wins!`
                      : isMyTurn
                        ? 'Roll the dice!'
                        : `${
                            room.players.find(
                              (p) =>
                                p.id ===
                                room.currentTurn
                            )?.name
                          }'s turn`}
                  </div>
                </div>

                {/* DICE / REMATCH BUTTON */}

                {room.status !==
                'finished' ? (
                  <button
                    type="button"
                    onClick={
                      roll
                    }
                    disabled={
                      !isMyTurn ||
                      !connected
                    }
                    className="inline-flex h-14 min-w-[4.5rem] shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 text-sm font-black text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    <Dices className="h-5 w-5" />

                    <span className="hidden sm:inline">
                      Roll
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      rematch
                    }
                    className="inline-flex h-14 min-w-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-indigo-500 px-4 text-sm font-black text-white transition hover:bg-indigo-400"
                  >
                    Rematch
                  </button>
                )}
              </div>

              {/* NOTICE */}

              {notice && (
                <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-center text-xs font-semibold text-amber-200">
                  {notice}
                </div>
              )}
            </div>
          </div>

          {/* ====================================================
              PLAYER POSITION / TURN
              ==================================================== */}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[.03] p-4">
            <div className="text-sm text-slate-400">
              <span className="text-slate-500">
                You:
              </span>{' '}
              <strong className="text-white">
                {me?.name}
              </strong>{' '}
              • Square{' '}
              <strong className="text-white">
                {me?.position}
              </strong>
            </div>

            <div className="text-sm">
              {room.status ===
              'finished' ? (
                <span className="font-black text-amber-300">
                  🏆{' '}
                  {winner?.name}{' '}
                  wins!
                </span>
              ) : (
                <span>
                  Turn:{' '}
                  <strong className="text-indigo-300">
                    {
                      room.players.find(
                        (p) =>
                          p.id ===
                          room.currentTurn
                      )?.name
                    }
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* ====================================================
              SCOREBOARD
              ==================================================== */}

          <div className="mt-4 rounded-2xl border border-white/5 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-widest text-slate-500">
                Scoreboard
              </div>

              <button
                type="button"
                onClick={() =>
                  setScoreboardOpen(
                    (open) =>
                      !open
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 hover:bg-white/[.08] lg:hidden"
              >
                {scoreboardOpen
                  ? 'Hide'
                  : 'Show'}
              </button>
            </div>

            <div
              className={`${
                scoreboardOpen
                  ? 'block'
                  : 'hidden'
              } mt-3 space-y-3 lg:block`}
            >
              {sortedPlayers.map(
                (
                  playerData
                ) => (
                  <div
                    key={
                      playerData.id
                    }
                    className="flex items-center justify-between rounded-2xl bg-white/5 p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {
                          playerData.name
                        }
                      </div>

                      <div className="text-xs text-slate-500">
                        Square{' '}
                        {
                          playerData.position
                        }
                      </div>
                    </div>

                    <div className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-emerald-300">
                      {
                        playerData.wins
                      }{' '}
                      wins
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            DESKTOP SIDEBAR
            ====================================================== */}

        <aside className="space-y-5">
          {/* DESKTOP DICE / TURN PANEL */}

          <div className="hidden rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 lg:block">
            {room.status ===
            'finished' ? (
              <div className="text-center">
                <Trophy
                  className="mx-auto text-amber-300"
                  size={48}
                />

                <h2 className="mt-3 text-2xl font-black">
                  {winner?.name}{' '}
                  wins!
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Congratulations.
                  Ready for
                  another
                  round?
                </p>

                <button
                  onClick={
                    rematch
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 font-black hover:bg-indigo-400"
                >
                  <RotateCcw
                    size={18}
                  />

                  Rematch
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`rounded-2xl p-4 text-center ${
                    isMyTurn
                      ? 'bg-indigo-500/15 ring-1 ring-indigo-400/20'
                      : 'bg-white/[.03]'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {isMyTurn
                      ? 'Your turn'
                      : 'Waiting'}
                  </div>

                  <div className="mt-1 text-xl font-black">
                    {isMyTurn
                      ? 'Roll the dice!'
                      : `${
                          room.players.find(
                            (p) =>
                              p.id ===
                              room.currentTurn
                          )?.name
                        }'s turn`}
                  </div>
                </div>

                <div className="mt-6">
                  <Dice
                    value={
                      dice
                    }
                    disabled={
                      !isMyTurn ||
                      !connected
                    }
                    onRoll={
                      roll
                    }
                  />
                </div>
              </>
            )}

            {notice && (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-center text-sm font-semibold text-amber-200">
                {notice}
              </div>
            )}
          </div>

          {/* PLAYERS */}

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-black">
                Players
              </h2>

              <span className="text-xs text-slate-500">
                {room.players.length}
                /4
              </span>
            </div>

            <PlayerList
              players={
                room.players
              }
              currentPlayerId={
                player.id
              }
              currentTurn={
                room.currentTurn
              }
            />
          </div>

          {/* LEAVE GAME */}

          <button
            onClick={leave}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/[.05]"
          >
            <LogOut
              size={17}
            />

            Leave Game
          </button>
        </aside>
      </div>
    </main>
  )
}