import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'

export default function RoomHeader({ roomId }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard?.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header className="flex flex-col gap-4 border-b border-white/5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <Logo />
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
    </header>
  )
}