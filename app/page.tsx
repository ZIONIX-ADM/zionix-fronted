"use client"

import AIInterpretation from "./component/AIInterpretation"
import RankingCard from "./component/RankingCard"
import InfoTooltip from "./component/Tooltip"
import { TOOLTIPS } from "./component/tooltips"
import { calcularScoreDiagnostico, gerarCenario, gerarRecomendacao } from "./core/score"
import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from "recharts"

export default function Home() {
  const [ticker, setTicker] = useState("")
  const [resultado, setResultado] = useState<any>(null)
  const [mostrarGrafico, setMostrarGrafico] = useState(false)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [ranking, setRanking] = useState<any[]>([])

  const variacao = resultado?.variacao_percentual ?? 0
  const setor = resultado?.setor ?? ""

  const diagnostico = resultado
    ? calcularScoreDiagnostico({
        precos: resultado.grafico?.precos ?? [],
        highs: resultado.grafico?.highs ?? [],
        lows: resultado.grafico?.lows ?? [],
        datas: resultado.grafico?.datas ?? [],
        mercado: resultado.mercado ?? "neutro",
        setor
      })
    : { score: 0, decisao: "aguardar" }

  const score = diagnostico.score
  const sinal = gerarRecomendacao(score)
  const cenario = gerarCenario(variacao)

  const dadosGrafico = resultado?.grafico?.datas?.map((data: string, i: number) => ({
    data,
    preco: resultado?.grafico?.precos?.[i],
  })) || []

  async function buscar() {
    if (!ticker) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buscar/${ticker}`)
      if (!res.ok) throw new Error(`Erro na API: ${res.status}`)
      const data = await res.json()
      setResultado(data)
      setMostrarGrafico(false)
    } catch (err) {
      console.error("Erro ao buscar ativo:", err)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("watchlist")
    if (saved) setWatchlist(JSON.parse(saved))
  }, [])

  useEffect(() => {
    async function carregarRanking() {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => {})
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranking`)
        const data = await res.json()
        setRanking(data)
      } catch (err) {
        console.error("Erro ao carregar ranking:", err)
      }
    }
    carregarRanking()
  }, [])

  function toggleWatchlist(t: string) {
    const saved = JSON.parse(localStorage.getItem("watchlist") || "[]")
    const updated = saved.includes(t) ? saved.filter((x: string) => x !== t) : [...saved, t]
    localStorage.setItem("watchlist", JSON.stringify(updated))
    setWatchlist(updated)
  }

  const mercadoBadge =
    resultado?.mercado === "bull" ? { label: "Mercado em Alta", bg: "#dcfce7", color: "#166534" } :
    resultado?.mercado === "bear" ? { label: "Mercado em Baixa", bg: "#fee2e2", color: "#991b1b" } :
    { label: "Mercado Neutro", bg: "#f3f4f6", color: "#374151" }

  return (
    <main className="min-h-screen" style={{ background: "#f7f7f5", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ========== HERO ESCURO ========== */}
      {!resultado && (
        <section style={{ background: "#0a0a0a" }} className="w-full px-6 pt-12 pb-16 flex flex-col items-center">

          {/* Badge */}
          <div
            className="mb-6 text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full"
            style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
          >
            394 ATIVOS ANALISADOS HOJE
          </div>

          {/* Título */}
          <h2 className="text-white text-center font-bold leading-tight mb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", maxWidth: 600 }}>
            Descubra as melhores<br />ações da B3
          </h2>
          <p className="text-center mb-10 text-sm" style={{ color: "#6b7280", maxWidth: 420 }}>
            Motor de análise técnica com 394 ativos ranqueados por score diário.
          </p>

          {/* Busca */}
          <div className="flex gap-2 w-full" style={{ maxWidth: 520 }}>
            <div
              className="flex items-center flex-1 px-4 py-3 rounded-xl"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <span style={{ color: "#6b7280" }} className="mr-2 text-sm">🔍</span>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscar()}
                placeholder="Digite o ticker (ex: PETR4)"
                className="w-full outline-none bg-transparent text-sm"
                style={{ color: "#ffffff" }}
              />
            </div>
            <button
              onClick={buscar}
              className="px-5 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
              style={{ background: "#C9A84C", color: "#0a0a0a" }}
            >
              Analisar
            </button>
          </div>

        </section>
      )}

      {/* Busca quando há resultado (fundo claro) */}
      {resultado && (
        <div className="flex gap-2 px-6 pt-6 pb-2" style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            className="flex items-center flex-1 px-4 py-3 rounded-xl bg-white"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <span className="text-gray-400 mr-2 text-sm">🔍</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Buscar outro ativo..."
              className="w-full outline-none bg-transparent text-sm text-gray-800"
            />
          </div>
          <button
            onClick={buscar}
            className="px-5 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
            style={{ background: "#C9A84C", color: "#0a0a0a" }}
          >
            Analisar
          </button>
        </div>
      )}

      {/* ========== RANKING ========== */}
      {!resultado && (
        <section className="px-6 py-10" style={{ maxWidth: 680, margin: "0 auto" }}>

          <p className="text-xs font-semibold tracking-[0.15em] mb-4" style={{ color: "#9ca3af" }}>
            TOP OPORTUNIDADES
          </p>

          {ranking.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm text-gray-400 text-sm">
              Carregando oportunidades...
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.slice(0, 5).map((ativo) => (
                <RankingCard
                  key={ativo.ticker}
                  ticker={ativo.ticker}
                  nome={ativo.nome}
                  sinal={ativo.sinal}
                  score={ativo.score}
                />
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: "Ativos analisados", value: "394" },
              { label: "Alta confiabilidade", value: "121" },
              { label: "Última atualização", value: "18h30" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
                <p className="font-bold text-xl text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

        </section>
      )}

      {/* ========== RESULTADO ========== */}
      {resultado && (
        <div className="px-6 pb-16 space-y-4" style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* BLOQUEIO */}
          {resultado.nao_elegivel && (
            <div className="bg-red-50 border border-red-200 p-5 rounded-2xl mt-4">
              <p className="font-semibold text-red-800">{resultado.nome || resultado.ticker}</p>
              <p className="text-red-700 mt-1 text-sm">Não foi possível analisar: {resultado.motivo}</p>
            </div>
          )}

          {!resultado.nao_elegivel && (
            <>
              {/* CARD PRINCIPAL */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative mt-4">

                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => toggleWatchlist(resultado.ticker)}
                    className="text-xl text-gray-300 hover:text-yellow-500 transition"
                  >
                    {watchlist.includes(resultado.ticker) ? "⭐" : "☆"}
                  </button>
                  <button
                    onClick={() => setMostrarGrafico(!mostrarGrafico)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm"
                  >
                    {mostrarGrafico ? "−" : "+"}
                  </button>
                </div>

                <h2 className="text-base font-semibold text-gray-900">{resultado.nome}</h2>
                <p className="text-sm text-gray-400">{resultado.ticker}</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">{resultado.preco}</p>

                <p className={`text-sm font-medium mt-0.5 ${variacao >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {variacao >= 0 ? "+" : ""}{variacao}%
                </p>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap mt-3">
                  <span
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={
                      sinal.includes("Compra") ? { background: "#dcfce7", color: "#166534" } :
                      sinal === "Cautela" || sinal === "Evitar" ? { background: "#fef9c3", color: "#854d0e" } :
                      { background: "#f3f4f6", color: "#374151" }
                    }
                  >
                    {sinal}
                  </span>
                  {resultado.mercado && (
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium" style={{ background: mercadoBadge.bg, color: mercadoBadge.color }}>
                      {mercadoBadge.label} <InfoTooltip text={TOOLTIPS.regimeMercado} position="bottom" />
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="flex items-center gap-1">Score <InfoTooltip text={TOOLTIPS.score} /></span>
                    <span className="font-bold text-gray-900">{Math.round(score)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(score, 100)}%`, background: "#C9A84C" }} />
                  </div>
                </div>

                {/* Confiabilidade reduzida */}
                {resultado.confiabilidade === "reduzida" && (
                  <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
                    <span className="font-semibold">Confiabilidade reduzida: </span>
                    {resultado.avisos_confiabilidade?.join(" · ")}
                  </div>
                )}

                {/* Gráfico */}
                {mostrarGrafico && dadosGrafico.length > 0 && (
                  <div className="mt-6 w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosGrafico}>
                        <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip />
                        <Line type="monotone" dataKey="preco" stroke="#C9A84C" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* CENÁRIO */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Cenário</p>
                <p className="text-lg font-semibold mt-1 text-gray-900">{cenario}</p>
              </div>

              {/* GRID */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Setor", value: resultado.setor },
                  { label: "Moeda", value: resultado.moeda },
                  { label: "Exposição", value: resultado.exposicao },
                  { label: "Riscos", value: resultado.riscos },
                ].map((item) => (
                  <div key={item.label} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>

              <AIInterpretation texto={resultado.interpretacao_grafico} />
            </>
          )}
        </div>
      )}
    </main>
  )
}
