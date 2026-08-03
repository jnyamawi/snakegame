import { useState } from 'react'
import { Dices as DiceIcon } from 'lucide-react'

const faces = ['1', '2', '3', '4', '5', '6']

export default function Dice({ value, disabled, onRoll }) {
  const [rolling, setRolling] = useState(false)

  const roll = () => {
    if (disabled || rolling) return
    setRolling(true)
    setTimeout(() => setRolling(false), 550)
    onRoll()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`grid h-24 w-24 place-items-center rounded-3xl border border-white/10 bg-white/[.06] text-6xl shadow-xl ${rolling ? 'dice-roll' : ''}`}>
        {value ? faces[value - 1] : <DiceIcon className="h-16 w-16 text-white" />}
      </div>
      <button
        onClick={roll}
        disabled={disabled}
        className="rounded-2xl bg-indigo-500 px-8 py-3 font-black text-white transition hover:bg-indigo-400 disabled:hover:bg-indigo-500"
      >
        {rolling ? 'Rolling…' : 'ROLL DICE'}
      </button>
    </div>
  )
}