import { calcularScore, gerarSinal } from "../score"
type Ativo = {
  ticker: string
  score: number
  sinal: string
}

export function gerarRanking(ativos: any[]) {
  const ranking: Ativo[] = ativos.map((a) => {
    
    const variacao = a.variacao_percentual ?? 0
    const volatilidade = Math.abs(variacao)

    const tendencia =
      variacao > 0.5 ? "alta" :
      variacao < -0.5 ? "queda" :
      "lateral"

    const score = calcularScore({
      variacao,
      volatilidade,
      tendencia,
      setor: a.setor
    })

    const sinal = gerarSinal(score)

    return {
      ticker: a.ticker,
      score,
      sinal
    }
  })

  return ranking
    .filter(a => a.score >= 55) // 🔥 só oportunidades
    .sort((a, b) => b.score - a.score)
}