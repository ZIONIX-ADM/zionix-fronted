"use client"

import AIInterpretation from "./component/AIInterpretation"
import RankingCard from "./component/RankingCard"
import Link from "next/link"
import { calcularScoreDiagnostico, gerarCenario, gerarRecomendacao } from "./core/score"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function Home() {
  const pathname = usePathname()
  const [ticker, setTicker] = useState("")
  const [resultado, setResultado] = useState<any>(null)
  const [mostrarGrafico, setMostrarGrafico] = useState(false)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [aba, setAba] = useState("mercado")

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

      if (!res.ok) {
        throw new Error(`Erro na API: ${res.status}`)
      }

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

  // 🔥 CARREGAR DADOS DO RANKING
  useEffect(() => {
    async function carregarRanking() {
      try {
        // acorda o Railway antes de buscar os dados reais
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

  function toggleWatchlist(ticker: string) {
    const saved = JSON.parse(localStorage.getItem("watchlist") || "[]")

    let updated

    if (saved.includes(ticker)) {
      updated = saved.filter((t: string) => t !== ticker)
    } else {
      updated = [...saved, ticker]
    }

    localStorage.setItem("watchlist", JSON.stringify(updated))
    setWatchlist(updated)
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-gray-900 flex flex-col items-center pt-32">

      {/* SEARCH BOX */}
      <div className="flex gap-3 mt-8 mb-16">

        <div className="flex items-center bg-white px-5 py-3 rounded-2xl shadow-lg border border-gray-100 w-[380px]">
          <span className="text-gray-400 mr-2">🔍</span>

          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Digite o ticker (ex: petr4)"
            className="w-full outline-none bg-transparent"
          />
        </div>

        <button
          onClick={buscar}
          className="px-6 py-3 rounded-2xl bg-gradient-to-b from-black to-gray-800 text-white shadow-lg hover:scale-[1.03] transition"
        >
          Buscar
        </button>

      </div>

      {/* ================= RANKING ================= */}
{!resultado && (
  <div className="max-w-3xl w-full mt-6 space-y-3">

    <h2 className="text-xl font-semibold">
      🔥 Top oportunidades
    </h2>

    {ranking.length === 0 && (
      <div className="bg-white rounded-2xl p-5 shadow-sm text-gray-400">
        Carregando oportunidades...
      </div>
    )}

{ranking.slice(0, 3).map((ativo) => (
  <RankingCard
    key={ativo.ticker}
    ticker={ativo.ticker}
    sinal={ativo.sinal}
    score={ativo.score}
  />
))}

  </div>
)}

      {/* ================= RESULTADO ================= */}
      {resultado && (
        <div className="max-w-3xl mx-auto mt-12 space-y-6">

          {/* BLOQUEIO TOTAL — histórico insuficiente */}
          {resultado.nao_elegivel && (
            <div className="bg-red-50 border border-red-200 p-5 rounded-2xl">
              <p className="font-semibold text-red-800">{resultado.nome || resultado.ticker}</p>
              <p className="text-red-700 mt-1 text-sm">
                Não foi possível analisar este ativo: {resultado.motivo}
              </p>
            </div>
          )}

          {/* CARD PRINCIPAL */}
          {!resultado.nao_elegivel && <div className="bg-white p-6 rounded-2xl shadow-md relative">


            <div className="absolute top-4 right-4 flex gap-2">

              <button
                onClick={() => toggleWatchlist(resultado.ticker)}
                className="text-xl text-gray-400 hover:text-yellow-500 transition"
              >
                {watchlist.includes(resultado.ticker) ? "⭐" : "☆"}
              </button>

              <button
                onClick={() => setMostrarGrafico(!mostrarGrafico)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shadow-sm"
              >
                {mostrarGrafico ? "−" : "+"}
              </button>

            </div>

            <h2 className="text-lg font-medium">{resultado.nome}</h2>
            <p className="text-gray-400">{resultado.ticker}</p>

            <p className="text-4xl mt-3">{resultado.preco}</p>

            {/* SINAL + REGIME */}
            <div className="flex gap-2 flex-wrap justify-center mt-1">
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                {sinal}
              </span>
              {resultado.mercado && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  resultado.mercado === "bull" ? "bg-green-100 text-green-700" :
                  resultado.mercado === "bear" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  Mercado: {
                    resultado.mercado === "bull" ? "Alta" :
                    resultado.mercado === "bear" ? "Baixa" :
                    "Neutro"
                  }
                </span>
              )}
            </div>

            {/* SCORE */}
            <p className={`text-sm font-bold mt-2 ${
              score >= 70 ? "text-green-600" :
              score >= 40 ? "text-yellow-600" :
              "text-red-600"
            }`}>
              Score: {Math.round(score)}
            </p>

            {/* BADGE CONFIABILIDADE REDUZIDA */}
            {resultado.confiabilidade === "reduzida" && (
              <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
                <span className="font-semibold">Confiabilidade reduzida: </span>
                {resultado.avisos_confiabilidade?.join(" · ")}
              </div>
            )}

            {/* gráfico */}
            {mostrarGrafico && dadosGrafico.length > 0 && (
              <div className="mt-6 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico}>
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="preco" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ⚠️ CORRIGIDO */}
            <p className={`mt-1 ${
              variacao >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {variacao >= 0 ? "+" : ""}
              {variacao}%
            </p>

          </div>}

          {/* CENÁRIO */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-xs text-gray-400 uppercase">Cenário</p>
            <p className="text-xl mt-1">{cenario}</p>
          </div>

          {/* GRID (NÃO ALTERADO) */}
          <div className="grid grid-cols-2 gap-4">

            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs text-gray-400">Setor</p>
              <p>{resultado.setor}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs text-gray-400">Moeda</p>
              <p>{resultado.moeda}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs text-gray-400">Exposição</p>
              <p>{resultado.exposicao}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs text-gray-400">Riscos</p>
              <p>{resultado.riscos}</p>
            </div>

          </div>

          <AIInterpretation
  texto={resultado.interpretacao_grafico}
/>

        </div>
      )}
    </main>
  )
}