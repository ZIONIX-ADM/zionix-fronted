// Script de diagnóstico temporário — não faz parte do produto.
// Mostra os valores intermediários do motor TS (calcularScoreDiagnostico)
// para comparar com o que o motor Python (analisar_ativo) calculou.
import {
  type Candle,
  media,
  calcularRSI,
  classificarContexto,
  trendEngine,
  pullbackEngine
} from "../app/core/indicators"
import { gerarDiagnosticoDiario } from "../app/core/diagnostico"
import { calcularScoreEstrutural } from "../app/core/estrutural"

const BACKEND_URL = "http://localhost:8000"

async function main() {
  const tickers = [
    "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3",
    "WEGE3", "MGLU3", "B3SA3", "RENT3", "SUZB3",
    "GGBR4", "LREN3", "EQTL3", "RADL3", "CSAN3",
    "BBAS3", "PRIO3", "HAPV3"
  ]

  for (const ticker of tickers) {
    const res = await fetch(`${BACKEND_URL}/buscar/${ticker}`)
    const j = await res.json()
    const precos: number[] = j.grafico.precos
    const highs: number[] = j.grafico.highs
    const lows: number[] = j.grafico.lows
    const datas: string[] = j.grafico.datas
    const setor: string = j.setor
    const mercado: string = j.mercado

    const dados: Candle[] = precos.map((preco, idx) => ({
      data: datas[idx] ?? "",
      preco,
      open: preco,
      high: highs[idx] ?? preco,
      low: lows[idx] ?? preco,
      close: preco
    }))

    const i = precos.length - 1
    const mm9 = media(precos, 9, i)!
    const mm21 = media(precos, 21, i)!
    const mm50 = media(precos, 50, i)!
    const mm50Anterior = media(precos, 50, i - 5)!
    const preco5DiasAtras = precos[i - 5]

    const variacao = ((precos[i] - precos[i - 1]) / precos[i - 1]) * 100
    const volatilidade = Math.abs(variacao)

    let compressaoScore = 0
    if (volatilidade < 1.2) compressaoScore += 15
    if (volatilidade < 0.8) compressaoScore += 15

    let trendQuality = 0
    const slope = ((mm50 - mm50Anterior) / mm50Anterior) * 100
    if (slope > 0.2) trendQuality += 20
    if (slope > 0.5) trendQuality += 20
    const distanciaMM = ((precos[i] - mm50) / mm50) * 100
    if (distanciaMM > 1) trendQuality += 15
    if (mm9 > mm21) trendQuality += 15
    if (mm21 > mm50) trendQuality += 15

    let momentumScore = 0
    const variacao5dias = ((precos[i] - preco5DiasAtras) / preco5DiasAtras) * 100
    if (variacao5dias > 2) momentumScore += 10
    if (variacao5dias > 4) momentumScore += 15
    if (variacao5dias > 6) momentumScore += 20
    const aceleracaoMM = ((mm9 - mm21) / mm21) * 100
    if (aceleracaoMM > 1.5) momentumScore += 20
    if (variacao > 1.2) momentumScore += 15
    momentumScore = Math.min(momentumScore, 40)

    const contexto = classificarContexto(precos, i)
    let setup: { tipo: string } = { tipo: "sem_setup" }
    const trend = trendEngine(precos, dados, i)
    if (trend) setup = trend
    else {
      const pullback = pullbackEngine(precos, dados, i)
      if (pullback) setup = pullback
    }

    const rsi = calcularRSI(precos, 14, i)!
    const estrutural = calcularScoreEstrutural(dados)

    const ontem = precos[i - 1]
    const condicoesEntrada = (
      (precos[i] > ontem ? 1 : 0) +
      (mm9 > mm21 ? 1 : 0) +
      (precos[i] > mm50 ? 1 : 0)
    )

    const diagnostico = gerarDiagnosticoDiario({
      contexto,
      setup,
      trendQuality,
      momentumScore,
      compressaoScore,
      estrutural,
      volatilidade,
      rsi,
      mercado,
      condicoesEntrada,
      forca: 50
    })

    console.log(
      ticker.padEnd(6),
      `score=${String(diagnostico.score.toFixed(1)).padStart(5)}`,
      `condicoes=${condicoesEntrada}/3`,
      `contexto=${contexto.padEnd(15)}`,
      `decisao=${diagnostico.decisao.padEnd(8)}`
    )
  }
}

main()
