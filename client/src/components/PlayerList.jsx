const tokenStyles = [
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-400',
]

export default function PlayerList({ players = [], currentPlayerId, currentTurn }) {
  return (
    <div className="space-y-2">
      {players.map((player, index) => {
        const active = player.id === currentTurn
        const me = player.id === currentPlayerId
        return (
          <div
            key={player.id}
            className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
              active ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/5 bg-white/[.03]'
            }`}
          >
            <div className={`grid h-9 w-9 place-items-center rounded-xl ${tokenStyles[index % tokenStyles.length]} text-sm font-black text-slate-950`}>
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">
                {player.name} {me && <span className="text-xs text-indigo-300">(You)</span>}
              </div>
              <div className="text-xs text-slate-500">
                {player.host ? 'Host • ' : ''}Position: {player.position}
              </div>
            </div>
            {active && <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">TURN</span>}
          </div>
        )
      })}
    </div>
  )
}