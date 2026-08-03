import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Gamepad2, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo'
import { socket } from '../socket/socket'
import { getPlayer, savePlayer } from '../utils/storage'

export default function Home() {
  const navigate = useNavigate()

  const [name, setName] = useState(getPlayer()?.name || '')
  const [roomId, setRoomId] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return () => socket.removeAllListeners()
  }, [])

  const ensureConnection = () => {
    if (!socket.connected) {
      socket.connect()
    }
  }

  // CREATE ROOM
  const createRoom = () => {
    setError('')

    if (!name.trim()) {
      setError('Enter your player name first.')
      return
    }

    if (maxPlayers < 2 || maxPlayers > 4) {
      setError('Choose between 2 and 4 players.')
      return
    }

    setLoading(true)
    ensureConnection()

    const handleCreated = ({ roomId: id, playerId }) => {
      savePlayer({
        id: playerId,
        name: name.trim(),
        roomId: id,
      })

      socket.off('room-created', handleCreated)

      navigate(`/room/${id}`)
    }

    const handleError = ({ message }) => {
      setLoading(false)
      setError(message)
    }

    socket.once('room-created', handleCreated)
    socket.once('room-error', handleError)

    socket.emit('create-room', {
      name: name.trim(),
      maxPlayers,
    })
  }

  // JOIN ROOM
  const joinRoom = () => {
    setError('')

    if (!name.trim()) {
      setError('Enter your player name first.')
      return
    }

    if (!roomId.trim()) {
      setError('Enter a Room ID.')
      return
    }

    setLoading(true)
    ensureConnection()

    const handleJoined = ({ roomId: id, playerId }) => {
      savePlayer({
        id: playerId,
        name: name.trim(),
        roomId: id,
      })

      socket.off('room-joined', handleJoined)

      navigate(`/room/${id}`)
    }

    const handleError = ({ message }) => {
      setLoading(false)
      setError(message)
    }

    socket.once('room-joined', handleJoined)
    socket.once('room-error', handleError)

    socket.emit('join-room', {
      roomId: roomId.trim().toUpperCase(),
      name: name.trim(),
    })
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* NAVBAR */}
        <nav className="flex items-center justify-between">
          <Logo />

          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
            ● LIVE MULTIPLAYER
          </span>
        </nav>

        {/* HERO */}
        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_.9fr]">

          <div>
            <div className="mb-5 inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-bold text-indigo-300">
              PLAY WITH FRIENDS ONLINE
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">
              Roll. Climb.
              <span className="block text-indigo-400">
                Avoid the snakes.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              Create a private room, choose how many friends can join,
              share the room code, and battle your way to square 100.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['2–4', 'Players'],
                ['100', 'Squares'],
                ['∞', 'Rematches'],
              ].map(([big, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/5 bg-white/[.03] p-4"
                >
                  <div className="text-2xl font-black">{big}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GAME CARD */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">

            <h2 className="text-2xl font-black">
              Start a game
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose your name and create or join a room.
            </p>

            {/* NAME */}
            <label className="mt-7 block text-sm font-semibold text-slate-300">
              Your name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value.slice(0, 18))
              }
              placeholder="e.g. Joseph"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-400"
            />

            {/* PLAYER COUNT */}
            <label className="mt-6 block text-sm font-semibold text-slate-300">
              Number of players
            </label>

            <p className="mt-1 text-xs text-slate-500">
              Choose the maximum number of players allowed in your room.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3">

              {[2, 3, 4].map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setMaxPlayers(number)}
                  className={`rounded-2xl border py-4 text-center transition ${
                    maxPlayers === number
                      ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400'
                      : 'border-white/10 bg-white/[.03] text-slate-400 hover:bg-white/[.07]'
                  }`}
                >
                  <div className="text-xl font-black">
                    {number}
                  </div>

                  <div className="text-xs">
                    Players
                  </div>
                </button>
              ))}

            </div>

            {/* CREATE */}
            <button
              onClick={createRoom}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3.5 font-black transition hover:bg-indigo-400"
            >
              <Gamepad2 size={19} />

              {loading
                ? 'Creating Room...'
                : 'Create New Room'}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
              <div className="h-px flex-1 bg-white/5" />

              OR

              <div className="h-px flex-1 bg-white/5" />
            </div>

            {/* JOIN */}
            <label className="block text-sm font-semibold text-slate-300">
              Room ID
            </label>

            <input
              value={roomId}
              onChange={(e) =>
                setRoomId(
                  e.target.value
                    .toUpperCase()
                    .slice(0, 8)
                )
              }
              placeholder="e.g. K7X4P2"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono uppercase tracking-widest outline-none focus:border-indigo-400"
            />

            <button
              onClick={joinRoom}
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5 font-black hover:bg-white/[.1]"
            >
              <Users size={19} />

              {loading
                ? 'Joining...'
                : 'Join Room'}
            </button>

            {/* ERROR */}
            {error && (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                size={15}
                className="text-emerald-400"
              />

              Dice rolls and game state are controlled by
              the server.
            </div>

          </div>
        </section>
      </div>
    </main>
  )
}

