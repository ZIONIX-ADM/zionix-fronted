import { rodarBacktest, avaliar } from "./backtest"
import fs from "fs"

const ativos = [
  "PETR4", "VALE3", "SUZB3",
  "ITUB4", "BBDC4", "BBAS3",
  "MGLU3", "LREN3", "VIIA3",
  "WEGE3", "EMBR3",
  "ABEV3", "JBSS3",
  "ELET3", "CPFE3",
  "MRVE3", "CYRE3",
  "TOTS3",
  "ALOS3", "SMFT3", "PRIO3", "RECV3", "VIVA3"
]

function forcaSetorial(ticker: string) {
  if (["PETR4", "VALE3", "SUZB3"].includes(ticker)) return 70
  if (["ITUB4", "BBDC4", "BBAS3"].includes(ticker)) return 85
  if (["MGLU3", "LREN3", "VIIA3"].includes(ticker)) return 30
  if (["WEGE3", "EMBR3"].includes(ticker)) return 80
  if (["ABEV3", "JBSS3"].includes(ticker)) return 55
  if (["ELET3", "CPFE3"].includes(ticker)) return 75
  if (["MRVE3", "CYRE3"].includes(ticker)) return 35
  if (ticker === "TOTS3") return 60

  return 50
}

const datasetTrades: any[] = []

function calcularScoreFinal(
  ticker: string,
  analise: any
) {
  const lucro = Number(analise.lucroTotal ?? 0)
  const acerto = Number(analise.taxaAcerto ?? 0)
  const drawdown = Number(analise.maxDrawdown ?? 0)
  const profitFactor = Number(analise.profitFactor ?? 0)
  const sharpe = Number(analise.sharpe ?? 0)
  const expectancy = Number(analise.expectancy ?? 0)
  const trades = Number(analise.totalTrades ?? 0)

  let score = 0

  // 🏗️ Estrutura base
  score += forcaSetorial(ticker) * 0.25

  // 💰 Lucro operacional
  score += lucro * 0.40

  // 🎯 Acerto
  score += acerto * 0.12

  // 📊 Profit Factor
  score += Math.min(profitFactor, 3) * 6

  // ⚡ Expectancy
  score += Math.min(expectancy, 5) * 2

  // 🧠 Sharpe suavizado
  score += Math.min(sharpe, 2) * 8

  // 📉 Drawdown
  score -= drawdown * 0.85

  // 🔢 Normalização por trades

  if (trades === 0) {
    score = 0
  }

  else if (trades <= 3) {
    score *= 0.55
  }

  else if (trades <= 5) {
    score *= 0.75
  }

  else if (trades <= 10) {
    score *= 0.90
  }

  else if (trades >= 30) {
    score *= 1.08
  }

  // 🚨 Penalizações institucionais

  if (lucro < 0)
    score *= 0.60

  if (expectancy < 0)
    score *= 0.75

  if (profitFactor < 1)
    score *= 0.70

  if (drawdown > 12)
    score *= 0.75

  // 🚫 Evita scores irreais
  score = Math.min(score, 100)

  return Math.max(
    Number(score.toFixed(2)),
    0
  )
}
async function main() {
  let tradesCarteira = 0

  const carteiraFinal: {
    ticker: string
    score: number
    lucro: number
    buyHold: number
    analise: any
  }[] = []

  for (const ticker of ativos) {

    const { resultados, buyHold } =
      await rodarBacktest(
        ticker,
        "2024-01-01",
        "2024-12-31"
      )

    const analise: any =
      avaliar(resultados)

    resultados.forEach((trade: any) => {

      datasetTrades.push({
        ticker,

        data: trade.data,

        score: trade.score,
        sinal: trade.sinal,
        retorno: trade.retorno,

        motivoSaida: trade.motivoSaida,
        lucroPerdido: trade.lucroPerdido,
        diasOperacao: trade.diasOperacao,
        contexto: trade.contexto,
        tendenciaSegueNaSaida: trade.tendenciaSegueNaSaida,

        trendScore: trade.trendScore,
        momentumFinal: trade.momentumFinal,
        riskScore: trade.riskScore,
        estruturalFinal: trade.estruturalFinal,
        confidenceScore: trade.confidenceScore,

        lucroTotal: analise.lucroTotal,
        taxaAcerto: analise.taxaAcerto,
        maxDrawdown: analise.maxDrawdown,
        sharpe: analise.sharpe,
        profitFactor: analise.profitFactor,
        expectancy: analise.expectancy,

        totalTrades: analise.totalTrades
      })

    })

    tradesCarteira +=
      analise.totalTrades

    const scoreFinal =
      calcularScoreFinal(
        ticker,
        analise
      )

    console.log(
      "🧠 Score Final:",
      scoreFinal.toFixed(2)
    )

    carteiraFinal.push({
      ticker,
      score: scoreFinal,
      lucro: analise.lucroTotal,
      buyHold,
      analise
    })

    console.log(`\n====================`)
    console.log(`📊 ${ticker}`)
    console.log("📈 Modelo:", analise.lucroTotal + "%")
    console.log("📊 Buy & Hold:", buyHold.toFixed(2) + "%")
    console.log("🎯 Acerto:", analise.taxaAcerto.toFixed(2) + "%")
    console.log("📉 Drawdown:", analise.maxDrawdown + "%")
    console.log("💰 Capital Final:", analise.capitalFinal)
    console.log("🔢 Trades:", analise.totalTrades)
    console.log("🧠 Score Final:", scoreFinal.toFixed(2))
  }

  // 🔥 ORDENA PELOS MELHORES SCORES
  carteiraFinal.sort(
    (a, b) => b.score - a.score
  )

  // 🏆 PEGA OS 5 MELHORES
  const topCarteira =
    carteiraFinal.slice(0, 5)

  console.log("\n🏆 RANKING ZIONIX\n")

  topCarteira.forEach((ativo, index) => {

    console.log(
      `${index + 1}. ${ativo.ticker} → ${ativo.score}`
    )

  })

  console.log("\n💼 PESOS DA CARTEIRA\n")

  const somaScores =
    topCarteira.reduce(
      (acc, ativo) => acc + ativo.score,
      0
    )

  const LIMITE_MAXIMO = 50

  let retornoCarteira = 0
  let caixa = 0

  for (const ativo of topCarteira) {

    let percentual =
      somaScores > 0
        ? (ativo.score / somaScores) * 100
        : 0

    if (percentual > LIMITE_MAXIMO) {

      caixa +=
        percentual - LIMITE_MAXIMO

      percentual =
        LIMITE_MAXIMO
    }

    retornoCarteira +=
      ativo.lucro * (percentual / 100)

    console.log(
      `${ativo.ticker} → ${percentual.toFixed(2)}%`
    )

  }

  if (caixa > 0) {

    console.log(
      `💵 CAIXA → ${caixa.toFixed(2)}%`
    )

  }

  const capitalCarteira =
    100 * (1 + retornoCarteira / 100)

  console.log("\n====================")
  console.log("🏦 CARTEIRA FINAL")
  console.log(`💰 Capital Final: ${capitalCarteira.toFixed(2)}`)
  console.log(`📈 Lucro Total: ${retornoCarteira.toFixed(2)}%`)
  console.log(`🔢 Trades Totais: ${tradesCarteira}`)
}

main()
  .then(() => {
    fs.writeFileSync(
      "dataset-trades.json",
      JSON.stringify(datasetTrades, null, 2)
    )

    console.log(
      "\n💾 Dataset salvo com sucesso!"
    )
  })
  .catch((erro) => {
    console.error("❌ Erro no backtest:", erro)
  })