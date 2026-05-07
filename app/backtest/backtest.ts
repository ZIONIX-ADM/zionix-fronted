import { calcularScore, gerarSinal } from "../core/score"
import { calcularScoreEstrutural } from "../core/estrutural"
import {
  setores,
  forcaSetor
} from "./setores"

type Candle = {
  data: string
  preco: number
}


// 🔎 FETCH DADOS
async function buscarDados(
  ticker: string,
  inicio: string,
  fim: string
){
  const res = await fetch(
    `http://localhost:8000/historico/${ticker}?inicio=${inicio}&fim=${fim}`
  )
  const data = await res.json()

  if (data.erro) {
    console.warn(`Erro no ativo ${ticker}`)
    return []
  }

  return data.dados
}

async function regimeMercado(
  inicio: string,
  fim: string
): Promise<"bull" | "bear" | "neutro"> {

  const dados =
  await buscarDados(
    "BOVA11",
    inicio,
    fim
  )

  if (!dados || dados.length < 220) {
    return "neutro"
  }
  
    const precos = dados.map((d: Candle) => d.preco)
  
    const atual = precos[precos.length - 1]
  
    const mm50 = media(precos, 50, precos.length - 1)
    const mm200 = media(precos, 200, precos.length - 1)
  
    if (!mm50 || !mm200) {
      return "neutro"
    }
  
    // 🚀 bull market
    if (
      atual > mm50 &&
      mm50 > mm200
    ) {
      return "bull"
    }
  
    // 🩸 bear market
    if (
      atual < mm50 &&
      mm50 < mm200
    ) {
      return "bear"
    }
  
    return "neutro"
  }

// 📊 MÉDIA MÓVEL
function media(precos: number[], periodo: number, index: number) {
  if (index < periodo) return null

  let soma = 0

  for (let i = index - periodo; i < index; i++) {
    soma += precos[i]
  }

  return soma / periodo
}

// 📊 IDENTIFICAR REGIME
function identificarRegime(
  precos: number[],
  i: number
) {

  const mm9 = media(precos, 9, i)
  const mm21 = media(precos, 21, i)
  const mm50 = media(precos, 50, i)

  if (!mm9 || !mm21 || !mm50) {
    return "neutro"
  }

  // 📈 força da tendência
  const distanciaMM =
    Math.abs(mm9 - mm21) / mm21

  // 🚀 aceleração
  const aceleracao =
    ((mm9 - mm21) / mm50) * 100

  // 🔥 TREND
  if (
    mm9 > mm21 &&
    mm21 > mm50 &&
    distanciaMM > 0.015
  ) {
    return "trend"
  }

  // 🚀 EXPLOSÃO
  if (
    mm9 > mm21 &&
    aceleracao > 4
  ) {
    return "explosao"
  }

  // 📊 LATERAL
  if (distanciaMM < 0.008) {
    return "lateral"
  }

  return "neutro"
}

// 📈 RSI
function calcularRSI(precos: number[], periodo: number, index: number) {
  if (index < periodo) return null

  let ganhos = 0
  let perdas = 0

  for (let i = index - periodo; i < index; i++) {
    const diff = precos[i] - precos[i - 1]

    if (diff > 0) ganhos += diff
    else perdas += Math.abs(diff)
  }

  const rs = ganhos / (perdas || 1)
  return 100 - (100 / (1 + rs))
}

function trendEngine(
  precos: number[],
  dados: Candle[],
  i: number
) {

  const mm9 = media(precos, 9, i)
  const mm21 = media(precos, 21, i)
  const mm50 = media(precos, 50, i)

  if (!mm9 || !mm21 || !mm50) {
    return null
  }


  // 🔥 tendência estrutural
  const distancia = ((mm21 - mm50) / mm50) * 100

  const tendenciaForte =
    mm21 > mm50 &&
    distancia > 2

  // 🔥 direção positiva
  const inclinacao =
    mm21 > media(precos, 21, i - 5)!

  // 🔥 preço acima da mm50
  const acimaEstrutura =
    precos[i] > mm50

  if (
    tendenciaForte &&
    inclinacao &&
    acimaEstrutura
  ) {

    console.log("🔥 TREND ENGINE:", dados[i].data)

    return {
      stop: -10,
      trailing: 12
    }
  }

  return null
}
function scoreEstrutural(
  precos: number[]
) { const ultimo = precos.length - 1

  const mm50 = media(precos, 50, ultimo)
  const mm200 = media(precos, 200, ultimo)

  if (!mm50 || !mm200) {
    return 0
  }

  let score = 0

  // 📈 MM200 inclinada pra cima
  const mm200Antiga =
    media(precos, 200, ultimo - 20)

  if (mm200Antiga) {

    const inclinacao =
      ((mm200 - mm200Antiga) / mm200Antiga) * 100

    if (inclinacao > 1)
      score += 30

    if (inclinacao > 3)
      score += 20
  }

  // 🚀 preço acima da MM200
  const distancia =
    ((precos[ultimo] - mm200) / mm200) * 100

  if (distancia > 5)
    score += 20

  if (distancia > 12)
    score += 10

  // 🔥 tendência consistente
  let tendenciaDias = 0

  for (let i = 200; i < precos.length; i++) {

    const mm9 = media(precos, 9, i)
    const mm21 = media(precos, 21, i)
    const mm50Local = media(precos, 50, i)

    if (
      mm9 &&
      mm21 &&
      mm50Local &&
      mm9 > mm21 &&
      mm21 > mm50Local
    ) {
      tendenciaDias++
    }
  }

  const percentualTrend =
    (tendenciaDias / (precos.length - 200)) * 100

  if (percentualTrend > 25)
    score += 10

  if (percentualTrend > 40)
    score += 10

  return score
}

// 🚀 BACKTEST
export async function rodarBacktest(
  ticker: string,
  inicio: string,
  fim: string
){
  const ativosBanidos = [
    "MRVE3",
    "MGLU3",
    "BBAS3",
    "SUZB3"
  ]
  
  if (ativosBanidos.includes(ticker)) {
    console.log(`🚫 Ativo banido: ${ticker}`)
  
    return {
      resultados: [],
      buyHold: 0
    }
  }
  const dados: Candle[] =
  await buscarDados(
    ticker,
    inicio,
    fim
  )

const mercado =
await regimeMercado(
  inicio,
  fim
)

console.log(
  `🌎 Regime mercado: ${mercado}`
)
  if (!dados || dados.length === 0) {
    return { resultados: [], buyHold: 0 }
  }

  const precos = dados.map(d => d.preco)

  let estrutural =
  calcularScoreEstrutural(dados)

  const setor =
  setores[ticker] || "neutro"

const forca =
  forcaSetor[setor] || 50

console.log(
  `🏢 Setor: ${setor} | Força: ${forca}`
)

if (
  mercado === "bear" &&
  estrutural < 60
) {

  console.log(
    `🩸 Mercado ruim bloqueando ${ticker}`
  )

  return {
    resultados: [],
    buyHold: 0
  }
}

if (mercado === "bear") {
  estrutural *= 0.75
}

  console.log(
    `🏗️ ${ticker} Score estrutural: ${estrutural}`
  )

  if (
    estrutural < 30 ||
    forca < 40
  ){

  console.log(
    `🚫 Ativo banido: ${ticker}`
  )

  return {
    resultados: [],
    buyHold: 0
  }
}

  // 📊 BUY & HOLD
  const precoInicial = dados[0].preco
  const precoFinal = dados[dados.length - 1].preco

  const buyHold =
    ((precoFinal - precoInicial) / precoInicial) * 100

  let resultados: any[] = []

  let capital = 100
let picoCapital = 100

  for (let i = 21; i < dados.length - 1; i++) {

    const hoje = dados[i]
    const ontem = dados[i - 1]

    // 📊 MÉDIAS
    const mm9 = media(precos, 9, i)
    const mm21 = media(precos, 21, i)
    const mm50 = media(precos, 50, i)

    if (!mm9 || !mm21 || !mm50) continue

    // 📈 VARIAÇÃO
    const variacao =
      ((hoje.preco - ontem.preco) / ontem.preco) * 100

    const volatilidade = Math.abs(variacao)

    // 🔥 TREND QUALITY
    const mm50Anterior = media(precos, 50, i - 5)

    if (!mm50Anterior) continue

    let trendQuality = 0
    let momentumScore = 0

    // 📈 inclinação MM50
    const slope =
      ((mm50 - mm50Anterior) / mm50Anterior) * 100

    if (slope > 0.3) trendQuality += 25
    if (slope > 0.6) trendQuality += 25

    // 📊 distância da MM50
    const distanciaMM =
      ((hoje.preco - mm50) / mm50) * 100

    if (distanciaMM > 1) {
      trendQuality += 20
    }

    // 🚀 força recente
    if (i < 5) continue

    const preco5DiasAtras = dados[i - 5].preco

    const variacao5dias =
      ((hoje.preco - preco5DiasAtras) /
        preco5DiasAtras) *
      100

      // 🚀 MOMENTUM

if (variacao5dias > 5) {
  momentumScore += 25
}

if (variacao5dias > 8) {
  momentumScore += 25
}

// 📈 expansão da MM9
const aceleracaoMM =
  ((mm9 - mm21) / mm21) * 100

if (aceleracaoMM > 2) {
  momentumScore += 25
}

// 🔥 candle forte
if (variacao > 1.2) {
  momentumScore += 25
}

    if (variacao5dias > 3) {
      trendQuality += 20
    }

    // 🌪️ volatilidade controlada
    if (volatilidade < 2.5) {
      trendQuality += 10
    }
    let qualidadeFinal =
    trendQuality + momentumScore
  
  if (qualidadeFinal < 70) {
    qualidadeFinal *= 0.7
  }
  
  if (qualidadeFinal < 50) {
    continue
  }


    // 📊 REGIME
    const regime = identificarRegime(precos, i)

    // 🔥 TREND ENGINE
    const trend = trendEngine(precos, dados, i)

    if (!trend && regime === "neutro") continue

    // 🔥 FILTRO DE TENDÊNCIA REAL
    const cruzamentoFraco =
  mm9 < mm21 &&
  ((mm21 - mm9) / mm21) > 0.01

if (cruzamentoFraco) continue
    if (mm9 < mm21) continue
    if (precos[i] < mm9) continue

    // 📊 RSI
    const rsi = calcularRSI(precos, 14, i)

    if (!rsi || rsi < 45 || rsi > 70) continue

    // 🌪️ filtro volatilidade extrema
    if (volatilidade > 2.5) continue

    // 📊 SCORE
    const score = calcularScore({
      variacao,
      volatilidade,
      tendencia: "alta",
      setor: "neutro"
    })

    let scoreMinimo = 70

    if (regime === "explosao") {
      scoreMinimo = 55
    }
    
    if (regime === "lateral") {
      scoreMinimo = 80
    }
    
    if (score < scoreMinimo) continue

    const sinal = gerarSinal(score)

    // 🚀 ENTRADA
    let tamanhoPosicao = 1
    if (volatilidade > 2) {
      tamanhoPosicao -= 0.5
    }
    
    if (volatilidade < 1) {
      tamanhoPosicao += 0.5
    }

    if (estrutural >= 90) {
      tamanhoPosicao += 0.5
    }
    
    if (forca >= 80) {
      tamanhoPosicao += 0.5
    }
    
    if (regime === "explosao") {
      tamanhoPosicao += 0.5
    }
    const precoEntrada = hoje.preco

    let precoSaida = precoEntrada
    let maxLucro = 0

    let j = i + 1

    const stop = trend ? trend.stop : -5
    const trailing = trend ? trend.trailing : 5

    while (j < dados.length) {

      const precoAtual = dados[j].preco

      const variacaoAtual =
        ((precoAtual - precoEntrada) / precoEntrada) * 100

      if (variacaoAtual > maxLucro) {
        maxLucro = variacaoAtual
      }

      // 🔥 trailing stop
      if (maxLucro - variacaoAtual > trailing) {
        precoSaida = precoAtual
        break
      }

      // 🔥 stop loss
      if (variacaoAtual < stop) {
        precoSaida = precoAtual
        break
      }

      // 📈 tendência continua?
      const mm9Atual = media(precos, 9, j)
      const mm21Atual = media(precos, 21, j)

      precoSaida = precoAtual

      j++
    }
    const retornoBase =
    ((precoSaida - precoEntrada) / precoEntrada) * 100
  
  const retorno =
    retornoBase * tamanhoPosicao

    capital *= (1 + retorno / 100)

if (capital > picoCapital) {
  picoCapital = capital
}

const drawdownAtual =
  ((picoCapital - capital) / picoCapital) * 100

  if (drawdownAtual > 12) {
    console.log(
      "🛑 MODO DEFENSIVO ATIVADO"
    )
  
    break
  }

    resultados.push({
      data: hoje.data,
      score,
      sinal,
      retorno
    })

    // 🔥 evita trades repetidos
    i = j
  }

  return {
    resultados,
    buyHold
  }
}

export function avaliar(resultados: any[]) {
  let acertos = 0
  let total = 0
  let lucro = 0

  let capital = 100
  let pico = 100
  let maxDrawdown = 0

  const custo = 0.2

  resultados.forEach(r => {
    total++

    let lucroTrade = 0

    if (r.sinal.includes("entrada")) {

      lucroTrade = r.retorno - custo

      if (lucroTrade > 0) {
        acertos++
      }

    } else if (r.sinal.includes("venda")) {

      lucroTrade = -r.retorno - custo

      if (lucroTrade > 0) {
        acertos++
      }
    }

    lucro += lucroTrade

    capital *= (1 + lucroTrade / 100)

    if (capital > pico) {
      pico = capital
    }

    const drawdown = (pico - capital) / pico

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  })

  return {
    taxaAcerto:
      total > 0
        ? (acertos / total) * 100
        : 0,

    lucroTotal: Number(lucro.toFixed(2)),

    lucroMedio:
      total > 0
        ? Number((lucro / total).toFixed(2))
        : 0,

    maxDrawdown:
      Number((maxDrawdown * 100).toFixed(2)),

    capitalFinal:
      Number(capital.toFixed(2)),

    totalTrades: total
  }
}
