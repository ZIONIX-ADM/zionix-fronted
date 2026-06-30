"use client"

import { useEffect, useState } from "react"
import { calcularScore, gerarCenario, gerarSinal } from "../core/score"
export default function Watchlist() {
  const [ativos, setAtivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarWatchlist() {
      try {
        const saved = JSON.parse(localStorage.getItem("watchlist") || "[]")

        if (saved.length === 0) {
          setAtivos([])
          setLoading(false)
          return
        }

        const ativosComDados = await Promise.all(
          saved.map(async (ticker: string) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buscar/${ticker}`)
            const data = await res.json()

            const variacao = data.variacao_percentual ?? 0
const volatilidade = Math.abs(variacao)

const tendencia =
  variacao > 0.5 ? "alta" :
  variacao < -0.5 ? "queda" :
  "lateral"

const setor = data.setor ?? ""

const score = calcularScore({
  variacao,
  volatilidade,
  tendencia,
  setor
})

const sinal = gerarSinal(score)
const cenario = gerarCenario(variacao)

return {
  ...data,
  score,
  sinal,
  cenario
} })
        )

        setAtivos(ativosComDados)
      } catch (error) {
        console.error("Erro ao carregar watchlist:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarWatchlist()
  }, [])

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando sua watchlist...</div>
  }

  return (
    <div className="p-8 bg-[#f5f5f7] min-h-screen">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Sua Watchlist</h1>
        <p className="text-gray-500 text-sm">
          Acompanhe rapidamente seus ativos e tome decisões.
        </p>
      </div>

      {/* EMPTY */}
      {ativos.length === 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm text-gray-500">
          Nenhum ativo salvo ainda.
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-3 gap-6">
        {ativos.map((ativo, i) => {

          const variacaoPositiva = ativo.variacao_percentual >= 0

          const corBorda =
            ativo.sinal?.includes("entrada") ? "border-green-500" :
            ativo.sinal?.includes("venda") ? "border-red-500" :
            "border-gray-200"

          const badgeCor =
            ativo.sinal?.includes("entrada") ? "bg-green-100 text-green-700" :
            ativo.sinal?.includes("venda") ? "bg-red-100 text-red-700" :
            "bg-gray-100 text-gray-600"

          return (
            <div
              key={ativo.ticker || i}
              className={`bg-white rounded-xl p-5 shadow-sm border ${corBorda} hover:shadow-md transition`}
            >

              {/* HEADER CARD */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg">{ativo.ticker}</h2>
                  <p className="text-sm text-gray-500">{ativo.nome}</p>
                </div>

                <span className={`text-xs px-2 py-1 rounded ${badgeCor}`}>
                  {ativo.sinal || "neutro"}
                </span>
              </div>

              {/* PREÇO */}
              <p className="text-2xl mt-4 font-medium">
                {ativo.preco}
              </p>

              {/* VARIAÇÃO */}
              <p className={`text-sm font-medium ${
                variacaoPositiva ? "text-green-600" : "text-red-600"
              }`}>
                {variacaoPositiva ? "+" : ""}
                {ativo.variacao_percentual}%
              </p>

              {/* SCORE */}
              <p className={`text-sm font-bold mt-2 ${
                ativo.score >= 70 ? "text-green-600" :
                ativo.score >= 40 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                Score: {ativo.score}
              </p>

              {/* CENÁRIO */}
              <div className="mt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Cenário
                </p>
                <p className="text-sm font-medium">
                  {ativo.cenario}
                </p>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}