"use client"

import { useEffect, useState } from "react"

type Analises = {
  mercado: string
  total_ativos: number
  por_decisao: Record<string, number>
  distribuicao: { faixa: string; count: number }[]
  por_setor: { setor: string; count: number; score_medio: number; top_ticker: string }[]
  destaques: {
    top_momentum: { ticker: string; score: number; contexto: string; sinal: string }[]
    top_estrutural: { ticker: string; score: number; contexto: string; sinal: string }[]
  }
}

const DECISAO_LABEL: Record<string, string> = {
  comprar: "Comprar",
  manter: "Manter",
  aguardar: "Aguardar",
  cautela: "Cautela",
  evitar: "Evitar",
}

const DECISAO_COLOR: Record<string, { bg: string; color: string }> = {
  comprar:  { bg: "#dcfce7", color: "#166534" },
  manter:   { bg: "#dbeafe", color: "#1e40af" },
  aguardar: { bg: "#f3f4f6", color: "#374151" },
  cautela:  { bg: "#fef9c3", color: "#854d0e" },
  evitar:   { bg: "#fee2e2", color: "#991b1b" },
}

const MERCADO_INFO: Record<string, { label: string; cor: string; desc: string }> = {
  bull:   { label: "Alta", cor: "#16a34a", desc: "IBOV acima das médias móveis — ambiente favorável" },
  bear:   { label: "Baixa", cor: "#dc2626", desc: "IBOV abaixo das médias móveis — ambiente de risco" },
  neutro: { label: "Neutro", cor: "#6b7280", desc: "Mercado sem tendência definida — cautela recomendada" },
}

export default function AnalisesPage() {
  const [data, setData] = useState<Analises | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/analises`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const mercadoInfo = data ? (MERCADO_INFO[data.mercado] ?? MERCADO_INFO.neutro) : null
  const maxFaixa = data ? Math.max(...data.distribuicao.map(f => f.count)) : 1
  const maxSetor = data ? Math.max(...data.por_setor.map(s => s.score_medio)) : 1
  const temSetores = data ? data.por_setor.some(s => s.setor !== "Outros") : false

  return (
    <main className="min-h-screen" style={{ background: "#f7f7f5", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* HERO */}
      <section style={{ background: "#0a0a0a" }} className="w-full px-6 pt-10 pb-12 flex flex-col items-center">
        <div
          className="mb-5 text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full"
          style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
        >
          ANÁLISE DO MERCADO
        </div>
        <h2 className="text-white text-center font-bold leading-tight mb-2"
          style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
          Panorama completo da B3
        </h2>
        <p className="text-center text-sm" style={{ color: "#6b7280", maxWidth: 400 }}>
          Agregações em tempo real de {data?.total_ativos ?? "—"} ativos analisados.
        </p>
      </section>

      {loading && (
        <div className="flex justify-center py-20 text-gray-400 text-sm">Carregando análises...</div>
      )}

      {!loading && data && (
        <div className="px-6 py-10 space-y-8" style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* 1. PULSO DO MERCADO */}
          <section>
            <p className="text-xs font-semibold tracking-[0.15em] mb-4" style={{ color: "#9ca3af" }}>
              PULSO DO MERCADO
            </p>

            {/* Regime */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-3 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: mercadoInfo!.cor + "18", color: mercadoInfo!.cor }}
              >
                {data.mercado === "bull" ? "↑" : data.mercado === "bear" ? "↓" : "→"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Mercado em <span style={{ color: mercadoInfo!.cor }}>{mercadoInfo!.label}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{mercadoInfo!.desc}</p>
              </div>
            </div>

            {/* Decisões */}
            <div className="grid grid-cols-5 gap-2">
              {["comprar", "manter", "aguardar", "cautela", "evitar"].map(d => {
                const c = DECISAO_COLOR[d]
                const count = data.por_decisao[d] ?? 0
                return (
                  <div key={d} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <span
                      className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={c}
                    >
                      {DECISAO_LABEL[d]}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 2. DISTRIBUIÇÃO DE SCORES */}
          <section>
            <p className="text-xs font-semibold tracking-[0.15em] mb-4" style={{ color: "#9ca3af" }}>
              DISTRIBUIÇÃO DE SCORES
            </p>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              {data.distribuicao.map(f => (
                <div key={f.faixa} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-14 shrink-0">{f.faixa}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-5 rounded-full transition-all"
                      style={{
                        width: `${(f.count / maxFaixa) * 100}%`,
                        background: "#C9A84C",
                        opacity: f.faixa === "80-100" ? 1 : f.faixa === "60-80" ? 0.8 : f.faixa === "40-60" ? 0.6 : 0.4,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-8 text-right shrink-0">{f.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. POR SETOR */}
          {temSetores && <section>
            <p className="text-xs font-semibold tracking-[0.15em] mb-4" style={{ color: "#9ca3af" }}>
              POR SETOR
            </p>
            <div className="space-y-2">
              {data.por_setor.slice(0, 8).map(s => (
                <div key={s.setor} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.setor}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.count} ativos · destaque: {s.top_ticker}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">{s.score_medio}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100 w-16">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${(s.score_medio / maxSetor) * 100}%`, background: "#C9A84C" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>}

          {/* 4. DESTAQUES */}
          <section>
            <p className="text-xs font-semibold tracking-[0.15em] mb-4" style={{ color: "#9ca3af" }}>
              DESTAQUES
            </p>
            <div className="grid grid-cols-2 gap-4">

              {/* Top momentum */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 mb-3 font-medium">Top Momentum</p>
                <div className="space-y-3">
                  {data.destaques.top_momentum.map(a => (
                    <div key={a.ticker} className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "#0a0a0a", color: "#C9A84C" }}
                      >
                        {a.ticker.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{a.ticker}</p>
                        <p className="text-xs text-gray-400">{a.sinal}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0">{Math.round(a.score)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top estrutural */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 mb-3 font-medium">Top Estrutural</p>
                <div className="space-y-3">
                  {data.destaques.top_estrutural.map(a => (
                    <div key={a.ticker} className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "#0a0a0a", color: "#C9A84C" }}
                      >
                        {a.ticker.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{a.ticker}</p>
                        <p className="text-xs text-gray-400">{a.sinal}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0">{Math.round(a.score)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

        </div>
      )}
    </main>
  )
}
