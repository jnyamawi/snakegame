import { Copy, Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'

export default function RoomHeader({ roomId, isHost, onClose }) {
  const [copied, setCopied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const copy = async () => {
    await navigator.clipboard?.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header className="flex flex-col gap-4 border-b border-white/5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <Logo />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={copy}
          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-2 text-left hover:bg-white/[.07]"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Room ID</div>
            <div className="font-mono font-black tracking-widest">{roomId}</div>
          </div>
          {copied ? <Check className="text-emerald-400" size={18} /> : <Copy size={18} />}
        </button>

        {isHost && onClose && (
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/10 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/15"
            >
              <Trash2 size={16} />
              Close room
            </button>

            {confirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 text-left text-slate-100 shadow-2xl">
                  <h2 className="text-lg font-black text-white">Close room?</h2>
                  <p className="mt-3 text-sm text-slate-400">This will end the game and remove the room for all players.</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(false)}
                      className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[.06]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmOpen(false)
                        onClose()
                      }}
                      className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-500/20 hover:bg-rose-400"
                    >
                      Yes, close room
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  )
}