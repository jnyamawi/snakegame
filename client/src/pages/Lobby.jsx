import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  LogOut,
  Play,
  Share2,
  Wifi,
  WifiOff,
} from 'lucide-react'

import RoomHeader from '../components/RoomHeader'
import PlayerList from '../components/PlayerList'

import { socket } from '../socket/socket'
import {
  getPlayer,
  savePlayer,
  clearPlayer,
} from '../utils/storage'

export default function Lobby() {

  const { roomId } = useParams()

  const navigate = useNavigate()

  const player = getPlayer()

  const [room, setRoom] =
    useState(null)

  const [error, setError] =
    useState('')

  const [connected, setConnected] =
    useState(socket.connected)

  useEffect(() => {

    if (!player) {
      navigate('/')
      return
    }

    if (player.roomId !== roomId) {
      savePlayer({ ...player, roomId })
    }

    // CONNECT
    const onConnect = () => {

      setConnected(true)

      socket.emit(
        'rejoin-room',
        {
          roomId,
          playerId: player.id,
          name: player.name,
        }
      )
    }

    // DISCONNECT
    const onDisconnect = () => {
      setConnected(false)
    }

    // ROOM STATE
    const onState = (state) => {
      setRoom(state)

      if (state?.status === 'playing') {
        navigate(`/room/${roomId}/game`)
      }
    }

    // GAME STARTED
    const onStarted = () => {
      navigate(
        `/room/${roomId}/game`
      )
    }

    // ERROR
    const onError = ({
      message,
    }) => {
      setError(message)
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
      'game-started',
      onStarted
    )

    socket.on(
      'room-error',
      onError
    )

    // Connect if needed
    if (!socket.connected) {
      socket.connect()
    } else {

      socket.emit(
        'rejoin-room',
        {
          roomId,
          playerId: player.id,
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
        'game-started',
        onStarted
      )

      socket.off(
        'room-error',
        onError
      )

    }

  }, [roomId])

  // START GAME
  const startGame = () => {

    socket.emit(
      'start-game',
      {
        roomId,
        playerId: player.id,
      }
    )

  }

  // LEAVE ROOM
  const leave = () => {

    socket.emit(
      'leave-room',
      {
        roomId,
        playerId: player.id,
      }
    )

    clearPlayer()

    navigate('/')
  }

  // SHARE
  const share = async () => {

    const url =
      `${window.location.origin}/room/${roomId}`

    if (navigator.share) {

      await navigator.share({
        title:
          'Join my Snake & Ladder game',

        text:
          `Join room ${roomId}`,

        url,
      })

    } else {

      await navigator.clipboard?.writeText(
        url
      )

      alert(
        'Game link copied!'
      )
    }
  }

  if (!room) {

    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        Connecting to room…
      </div>
    )
  }

  const isHost =
    room.host === player.id

  const canStart =
    isHost &&
    room.players.length >= 2

  return (
    <main className="min-h-screen">

      <RoomHeader roomId={roomId} />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">

        {/* MAIN */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[.03] p-6 sm:p-8">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Game Lobby
              </div>

              <h1 className="mt-2 text-4xl font-black">
                Waiting for players
              </h1>

              <p className="mt-2 max-w-xl text-slate-400">
                Share the room ID with your friends.
                The host selected a maximum of{' '}
                <strong className="text-white">
                  {room.maxPlayers}
                </strong>{' '}
                players.
              </p>

            </div>

            {/* CONNECTION */}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
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
                : 'Disconnected'}

            </div>

          </div>

          {/* ROOM ID */}
          <div className="mt-8 rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-6">

            <div className="text-sm text-indigo-200">
              Your friends can join with:
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">

              <div className="font-mono text-3xl font-black tracking-[.25em]">
                {roomId}
              </div>

              <button
                onClick={share}
                className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/15"
              >
                <Share2 size={18} />
              </button>

            </div>

            <div className="mt-3 text-xs text-indigo-200/60">
              Maximum players in this room:{' '}
              <strong>
                {room.maxPlayers}
              </strong>
            </div>

          </div>

          {/* PLAYERS */}
          <div className="mt-8">

            <div className="mb-3 flex items-center justify-between">

              <h2 className="font-bold">
                Players ({room.players.length}/{room.maxPlayers})
              </h2>

              <span className="text-xs text-slate-500">

                {room.players.length >= room.maxPlayers
                  ? 'Room is full'
                  : room.players.length < 2
                    ? 'Waiting for another player…'
                    : 'Ready to play'}

              </span>

            </div>

            <PlayerList
              players={room.players}
              currentPlayerId={player.id}
              currentTurn={room.currentTurn}
            />

          </div>

        </section>

        {/* SIDEBAR */}
        <aside className="h-fit rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">

          <h2 className="text-xl font-black">
            Game controls
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">

            {isHost
              ? `You are the host. You selected ${room.maxPlayers} players for this room.`
              : 'The host will start the game when everyone is ready.'}

          </p>

          {/* PLAYER COUNT */}
          <div className="mt-5 rounded-2xl border border-white/5 bg-white/[.03] p-4">

            <div className="text-xs uppercase tracking-widest text-slate-500">
              Room capacity
            </div>

            <div className="mt-1 text-2xl font-black">
              {room.players.length}
              <span className="text-slate-500">
                /{room.maxPlayers}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    Math.min(
                      100,
                      (room.players.length /
                        room.maxPlayers) *
                        100
                    )
                  }%`,
                }}
              />

            </div>

          </div>

          {/* START */}
          {isHost && (

            <button
              onClick={startGame}
              disabled={!canStart}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 font-black text-slate-950 hover:bg-emerald-400"
            >

              <Play size={19} />

              {room.players.length < 2
                ? 'Waiting for Player...'
                : 'Start Game'}

            </button>

          )}

          {/* NON HOST */}
          {!isHost && (

            <div className="mt-6 rounded-2xl border border-white/5 bg-white/[.03] p-4 text-sm text-slate-400">

              Waiting for the host to start…

            </div>

          )}

          {/* ERROR */}
          {error && (

            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
              {error}
            </div>

          )}

          {/* LEAVE */}
          <button
            onClick={leave}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-300 hover:bg-white/[.05]"
          >

            <LogOut size={17} />

            Leave Room

          </button>

        </aside>

      </div>

    </main>
  )
}

