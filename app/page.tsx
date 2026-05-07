"use client"

import AIInterpretation from "./component/AIInterpretation"
import RankingCard from "./component/RankingCard"
import Link from "next/link"
import { calcularScore, gerarCenario, gerarSinal } from "./core/score"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { gerarRanking } from "./core/ranking"
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

  // 🔥 RANKING
  const [ativos, setAtivos] = useState<any[]>([])
  const ranking = gerarRanking(ativos)

  // ✅ DADOS CORRETOS (fix do score)
  const variacao = resultado?.variacao_percentual ?? 0
  const volatilidade = Math.abs(variacao)

  const tendencia =
    variacao > 0.5 ? "alta" :
    variacao < -0.5 ? "queda" :
    "lateral"

  const setor = resultado?.setor ?? ""

  // ✅ SCORE CORRETO
  const score = calcularScore({
    variacao,
    volatilidade,
    tendencia,
    setor
  })

  const sinal = gerarSinal(score)
  const cenario = gerarCenario(variacao)

  const dadosGrafico = resultado?.grafico?.datas?.map((data: string, i: number) => ({
    data,
    preco: resultado?.grafico?.precos?.[i],
  })) || []

  async function buscar() {
    if (!ticker) return

    try {
      const res = await fetch(`http://localhost:8000/buscar/${ticker}`)

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
        const tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4"]

        const dados = await Promise.all(
          tickers.map(async (ticker) => {
            const res = await fetch(`http://localhost:8000/buscar/${ticker}`)
            const data = await res.json()

            return {
              ticker,
              ...data
            }
          })
        )

        setAtivos(dados)
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

          {/* CARD PRINCIPAL */}
          <div className="bg-white p-6 rounded-2xl shadow-md relative">

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

            {/* 🔥 SINAL (NOVO, sem quebrar layout) */}
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
              {sinal}
            </span>

            {/* SCORE */}
            <p className={`text-sm font-bold mt-2 ${
              score >= 70 ? "text-green-600" :
              score >= 40 ? "text-yellow-600" :
              "text-red-600"
            }`}>
              Score: {score}
            </p>

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

          </div>

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