type Props = {
  ticker: string
  sinal: string
  score: number
  nome?: string
}

export default function RankingCard({ ticker, sinal, score, nome }: Props) {
  const avatar = ticker.slice(0, 3).toUpperCase()

  const badgeStyle =
    sinal?.includes("Compra") || sinal?.includes("compra")
      ? { background: "#dcfce7", color: "#166534" }
      : sinal === "Cautela" || sinal === "Evitar"
      ? { background: "#fef9c3", color: "#854d0e" }
      : { background: "#f3f4f6", color: "#374151" }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">

      {/* AVATAR */}
      <div
        style={{ background: "#0a0a0a", minWidth: 44, height: 44 }}
        className="rounded-xl flex items-center justify-center text-xs font-bold tracking-wide"
      >
        <span style={{ color: "#C9A84C" }}>{avatar}</span>
      </div>

      {/* INFO */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{ticker}</p>
        {nome && <p className="text-xs text-gray-400 truncate">{nome}</p>}
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium" style={badgeStyle}>
          {sinal}
        </span>
      </div>

      {/* SCORE */}
      <div className="text-right shrink-0" style={{ minWidth: 56 }}>
        <p className="text-xl font-bold text-gray-900">{Math.round(score)}</p>
        <div className="mt-1 h-1.5 rounded-full bg-gray-100 w-14">
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${Math.min(score, 100)}%`, background: "#C9A84C" }}
          />
        </div>
      </div>

    </div>
  )
}
