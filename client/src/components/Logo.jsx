import { Dices } from 'lucide-react'

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500 shadow-glow">
        <Dices size={24} />
      </div>
      <div>
        <div className="text-lg font-black tracking-tight">Snake<span className="text-indigo-400">&</span>Ladder</div>
        <div className="text-xs text-slate-400">ONLINE</div>
      </div>
    </div>
  )
}