import { rodarBacktest, avaliar } from "./backtest"

const ativos = [
  // 🛢️ COMMODITIES / MACRO (tendem a tendência)
  "PETR4",
  "VALE3",
  "SUZB3",

  // 🏦 BANCOS (mais estáveis / laterais)
  "ITUB4",
  "BBDC4",
  "BBAS3",

  // 🛍️ VAREJO / VOLÁTIL
  "MGLU3",
  "LREN3",
  "VIIA3",

  // ⚙️ INDUSTRIAL / QUALIDADE
  "WEGE3",
  "EMBR3",

  // 🍺 DEFENSIVOS
  "ABEV3",
  "JBSS3",

  // ⚡ ENERGIA
  "ELET3",
  "CPFE3",

  // 🏗️ CONSTRUÇÃO (cíclico)
  "MRVE3",
  "CYRE3",

  // 💻 TECNOLOGIA / GROWTH
  "TOTS3"
]

function calcularScoreEstrutural(
  ticker: string,
  analise: any
) {

  let scoreEstrutural = 0

  // 📈 PERFORMANCE
  scoreEstrutural += analise.lucroTotal * 0.4

  // 🎯 ASSERTIVIDADE
  scoreEstrutural += analise.taxaAcerto * 0.3

  // 🛡️ RISCO
  scoreEstrutural -= analise.maxDrawdown * 0.3

  // 🌎 REGIME
  scoreEstrutural += 20

  let qualidadeFinal =
  analise.lucroTotal +
  analise.taxaAcerto -
  analise.maxDrawdown

  if (qualidadeFinal < 70) {
    qualidadeFinal *= 0.7
  }

  if (qualidadeFinal < 50) {
    return 0
  }

  // 🏢 FORÇA SETORIAL

  if (
    ticker === "PETR4" ||
    ticker === "VALE3" ||
    ticker === "SUZB3"
  ) {
    scoreEstrutural += 80
  }

  if (
    ticker === "ITUB4" ||
    ticker === "BBDC4" ||
    ticker === "BBAS3"
  ) {
    scoreEstrutural += 90
  }

  if (
    ticker === "MGLU3" ||
    ticker === "LREN3" ||
    ticker === "VIIA3"
  ) {
    scoreEstrutural += 35
  }

  if (
    ticker === "WEGE3" ||
    ticker === "EMBR3"
  ) {
    scoreEstrutural += 70
  }

  if (
    ticker === "ABEV3" ||
    ticker === "JBSS3"
  ) {
    scoreEstrutural += 65
  }

  if (
    ticker === "ELET3" ||
    ticker === "CPFE3"
  ) {
    scoreEstrutural += 85
  }

  if (
    ticker === "MRVE3" ||
    ticker === "CYRE3"
  ) {
    scoreEstrutural += 25
  }

  if (ticker === "TOTS3") {
    scoreEstrutural += 50
  }

  return scoreEstrutural
}
async function main() {

  let lucroCarteira = 0
  let tradesCarteira = 0
  let retornoCarteira = 0

  const ranking: {
    ticker: string
    score: number
  }[] = []

  let somaScores = 0

  const pesos: {
    ticker: string
    peso: number
  }[] = []

  for (const ticker of ativos) {

    const { resultados, buyHold } =
    await rodarBacktest(
      ticker,
      "2024-01-01",
      "2024-12-31"
    )

    const analise = avaliar(resultados)

    lucroCarteira += analise.lucroTotal

    tradesCarteira += analise.totalTrades

    const scoreEstrutural =
  calcularScoreEstrutural(
    ticker,
    analise
  )
  if (scoreEstrutural > 0) {
    somaScores += scoreEstrutural
  }

  const pesoNormalizado =
  scoreEstrutural > 0
    ? scoreEstrutural / somaScores
    : 0
  
    retornoCarteira += (
      analise.lucroTotal
      * pesoNormalizado
    )

    // ====================
    // 📈 PERFORMANCE REAL
    // ====================

    ranking.push({
      ticker,
      score: scoreEstrutural
    })

   // 🚫 FILTRO
if (
  scoreEstrutural < 80 ||
  analise.totalTrades === 0 ||
  analise.lucroTotal <= 0
) {
  console.log(`🚫 ${ticker} removido da carteira`)
  continue
}
    pesos.push({
      ticker,
      peso: Math.max(scoreEstrutural, 0)
    })

    console.log(`\n====================`)
    console.log(`📊 ${ticker}`)

    console.log("📈 Modelo:", analise.lucroTotal + "%")
    console.log("📊 Buy & Hold:", buyHold.toFixed(2) + "%")

    console.log("🎯 Acerto:", analise.taxaAcerto.toFixed(2) + "%")
    console.log("📉 Drawdown:", analise.maxDrawdown + "%")
    console.log("💰 Capital Final:", analise.capitalFinal)
    console.log("🔢 Trades:", analise.totalTrades)

    console.log(
      "⭐ Score Estrutural:",
      scoreEstrutural.toFixed(2)
    )
  }

  ranking.sort((a, b) => b.score - a.score)

  console.log("\n🏆 RANKING ZIONIX\n")

  ranking.forEach((ativo, index) => {
    console.log(
      `${index + 1}. ${ativo.ticker} → ${ativo.score}`
    )
  })
  console.log(pesos)
  console.log("\n💼 PESOS DA CARTEIRA\n")

const somaPesos = pesos.reduce(
  (acc, p) => acc + p.peso,
  0
)

pesos.forEach((p) => {

  const percentual =
    (p.peso / somaPesos) * 100

  console.log(
    `${p.ticker} → ${percentual.toFixed(2)}%`
  )
})
const capitalCarteira =
  100 * (1 + retornoCarteira / 100)

  console.log("\n====================")
  console.log("🏦 CARTEIRA FINAL")

  console.log(
    `💰 Capital Final: ${capitalCarteira.toFixed(2)}`
  )
    console.log(`📈 Lucro Total: ${retornoCarteira.toFixed(2)}%`)


  console.log(
    `🔢 Trades Totais: ${tradesCarteira}`
  )
}

main()