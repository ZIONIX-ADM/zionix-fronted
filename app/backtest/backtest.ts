import { gerarSinal } from "../core/score"
import { calcularScoreEstrutural } from "../core/estrutural"
import { setores, forcaSetor } from "./setores"
import {
  type Candle,
  media,
  calcularRSI,
  calcularATR,
  classificarContexto,
  trendEngine,
  pullbackEngine
} from "../core/indicators"
import { type Decisao, gerarDiagnosticoDiario } from "../core/diagnostico"

async function buscarDados(
  ticker: string,
  inicio: string,
  fim: string
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/historico/${ticker}?inicio=${inicio}&fim=${fim}`
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
  const dados = await buscarDados(
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

  if (
    atual > mm50 &&
    mm50 > mm200
  ) {
    return "bull"
  }

  if (
    atual < mm50 &&
    mm50 < mm200
  ) {
    return "bear"
  }

  return "neutro"
}

function parametrosRisco(
  contexto: string,
  volatilidade: number,
  atr: number,
  trendQuality: number
) {
  let stop = atr * 2
  let trailing = atr * 1.5

  if (
    contexto === "tendencia_forte" &&
    trendQuality >= 70
  )
  {
    trailing = atr * 5
    stop = atr * 3
  }

  if (
    contexto === "pullback" &&
    trendQuality >= 55
  ) {
    trailing = atr * 3.5
stop = atr * 2.5
  }

  if (contexto === "lateral") {
    trailing = atr * 1.2
    stop = atr * 1.4
  }

  if (contexto === "bearish") {
    trailing = atr * 1
    stop = atr * 1.2
  }

  if (volatilidade > 7) {
    trailing *= 1.3
    stop *= 1.2
  }

  return {
    stop: -stop,
    trailing
  }
}

function pipelineEntrada(diagnostico: {
  score: number
  decisao: Decisao
}) {
  return {
    aprovado:
      diagnostico.decisao === "comprar" ||
      diagnostico.decisao === "manter",

    score: diagnostico.score
  }
}

export async function rodarBacktest(
  ticker: string,
  inicio: string,
  fim: string
) {
  const dados: Candle[] =
    await buscarDados(ticker, inicio, fim)

  const mercado =
    await regimeMercado(inicio, fim)

  console.log(`🌎 Regime mercado: ${mercado}`)

  if (!dados || dados.length === 0) {
    return {
      resultados: [],
      buyHold: 0
    }
  }

  const precos = dados.map(d => d.preco)

  let estrutural =
    calcularScoreEstrutural(dados)

  const setor =
    setores[ticker] || "neutro"

  const forca =
    forcaSetor[setor] || 50

  if (
    mercado === "bear" &&
    forca < 80
  ) {
    estrutural *= 0.9
  }

  if (
    mercado === "bear" &&
    forca >= 80 &&
    estrutural < 40
  ) {
    estrutural = 40
  }

  if (estrutural < 0) {
    estrutural = 0
  }

  const qualityScore =
(
  estrutural * 0.7 +
  forca * 0.3
)

  console.log(
    `🏗️ ${ticker} Score estrutural: ${estrutural}`
  )

  const precoInicial = dados[0].preco
  const precoFinal = dados[dados.length - 1].preco

  const buyHold =
    ((precoFinal - precoInicial) / precoInicial) * 100

  const resultados: any[] = []

  let capital = 100
  let picoCapital = 100

  let cooldown = 0
  let bloqueiosScore = 0
  let bloqueiosDefensivo = 0

  for (let i = 50; i < dados.length - 1; i++) {
    if (cooldown > 0) {
      cooldown--
      continue
    }

    const hoje = dados[i]
    const ontem = dados[i - 1]

    const mm9 = media(precos, 9, i)
    const mm21 = media(precos, 21, i)
    const mm50 = media(precos, 50, i)
    const mm50Anterior = media(precos, 50, i - 5)

    if (!mm9 || !mm21 || !mm50 || !mm50Anterior) {
      continue
    }

    const variacao =
      ((hoje.preco - ontem.preco) / ontem.preco) * 100

    const volatilidade =
      Math.abs(variacao)

    let compressaoScore = 0

    if (volatilidade < 1.2) compressaoScore += 15
    if (volatilidade < 0.8) compressaoScore += 15

    let trendQuality = 0
    let momentumScore = 0

    const slope =
      ((mm50 - mm50Anterior) / mm50Anterior) * 100

    if (slope > 0.2) trendQuality += 20
    if (slope > 0.5) trendQuality += 20

    const distanciaMM =
      ((hoje.preco - mm50) / mm50) * 100

    if (distanciaMM > 1) trendQuality += 15
    if (mm9 > mm21) trendQuality += 15
    if (mm21 > mm50) trendQuality += 15

    const preco5DiasAtras =
      dados[i - 5]?.preco

    if (!preco5DiasAtras) continue

    const variacao5dias =
      ((hoje.preco - preco5DiasAtras) /
        preco5DiasAtras) * 100

        if (variacao5dias > 2) momentumScore += 10
        if (variacao5dias > 4) momentumScore += 15
        if (variacao5dias > 6) momentumScore += 20

    const aceleracaoMM =
      ((mm9 - mm21) / mm21) * 100

    if (aceleracaoMM > 1.5) momentumScore += 20
    if (variacao > 1.2) momentumScore += 15
    momentumScore = Math.min(momentumScore, 40)

    const contexto =
      classificarContexto(precos, i)

    let setup: any = null

    const trend =
      trendEngine(precos, dados, i)

    if (trend) setup = trend

    if (!setup) {
      const pullback =
        pullbackEngine(precos, dados, i)

      if (pullback) setup = pullback
    }

    const tipoSetup =
      setup?.tipo || "sem_setup"

    console.log(
      "🧭 CONTEXTO:",
      contexto,
      "| SETUP:",
      tipoSetup
    )

    const rsi =
      calcularRSI(precos, 14, i)

    if (!rsi) continue

    const entradaConfirmada =
    hoje.preco > ontem.preco &&
    mm9 > mm21 &&
    hoje.preco > mm50

    const diagnostico =
      gerarDiagnosticoDiario({
        contexto,
        setup: { tipo: tipoSetup },
        trendQuality,
        momentumScore,
        compressaoScore,
        estrutural,
        volatilidade,
        rsi,
        mercado,
        entradaConfirmada,
        forca
      })

    const pipeline =
      pipelineEntrada(diagnostico)

    const scoreSwing =
      pipeline.score ?? 0

    if (tipoSetup === "sem_setup") {
      bloqueiosScore++
      continue
    }

    if (!pipeline.aprovado) {
      bloqueiosScore++
      continue
    }

    const sinal =
      gerarSinal(scoreSwing)

    let tamanhoPosicao: number
    if (scoreSwing >= 80)
      tamanhoPosicao = 1.00
    else if (scoreSwing >= 70)
      tamanhoPosicao = 0.75 + (scoreSwing - 70) / 10 * 0.25
    else if (scoreSwing >= 60)
      tamanhoPosicao = 0.50 + (scoreSwing - 60) / 10 * 0.25
    else if (scoreSwing >= 50)
      tamanhoPosicao = 0.30 + (scoreSwing - 50) / 10 * 0.20
    else if (scoreSwing >= 40)
      tamanhoPosicao = 0.15 + (scoreSwing - 40) / 10 * 0.15
    else
      tamanhoPosicao = 0.15

    const precoEntrada =
    hoje.preco
  
  let precoSaida =
    precoEntrada
  
  let maxLucro = 0
  let j = i + 1
  
  let motivoSaida = "fim_periodo"
  let tendenciaSegueNaSaida: boolean | null = null
  let desalinhamentoConsecutivo = 0
  
  const atr =
    calcularATR(dados, 14, i)
  
  if (!atr) continue
  
  const atrPercent =
    (atr / precoEntrada) * 100
  
  const risco =
    parametrosRisco(
      contexto,
      volatilidade,
      atrPercent,
      trendQuality
    )
  
  const stop = risco.stop
  const trailing = risco.trailing
  
  while (j < dados.length) {
    const precoAtual =
      dados[j].preco
  
    const variacaoAtual =
      ((precoAtual - precoEntrada) / precoEntrada) * 100
  
    if (variacaoAtual > maxLucro) {
      maxLucro = variacaoAtual
    }
  
    const mm9Atual = media(precos, 9, j)
    const mm21Atual = media(precos, 21, j)
    const mm50Atual = media(precos, 50, j)
  
    const tendenciaSegue =
      mm9Atual &&
      mm21Atual &&
      mm50Atual &&
      mm9Atual >= mm21Atual &&
      mm21Atual >= mm50Atual

    if (!tendenciaSegue && contexto === "tendencia_forte") {
      desalinhamentoConsecutivo++
    } else {
      desalinhamentoConsecutivo = 0
    }

    const desalinhamentoConfirmado =
      contexto === "tendencia_forte"
        ? desalinhamentoConsecutivo >= 2
        : !tendenciaSegue

    const segurandoTendencia =
      !desalinhamentoConfirmado &&
      variacaoAtual > 0 &&
      maxLucro > 1 &&
      maxLucro - variacaoAtual < trailing * 2.5

    if (
      !segurandoTendencia &&
      maxLucro - variacaoAtual > trailing
    ) {
      precoSaida = precoAtual
      motivoSaida = "trailing_stop"
      tendenciaSegueNaSaida = !!tendenciaSegue
      break
    }
  
    if (variacaoAtual < stop) {
      precoSaida = precoAtual
      motivoSaida = "stop_loss"
      break
    }
  
    precoSaida = precoAtual
    j++
  }
  
  let maiorPrecoDepois = precoSaida
  
  for (
    let k = j;
    k < Math.min(j + 20, dados.length);
    k++
  ) {
    if (dados[k].preco > maiorPrecoDepois) {
      maiorPrecoDepois = dados[k].preco
    }
  }
  
  const lucroPerdido =
    ((maiorPrecoDepois - precoSaida) / precoSaida) * 100
  
  const diasOperacao =
    j - i

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

    const trendScore =
      trendQuality

    const momentumFinal =
      momentumScore

    const riskScore =
      Math.max(0, 100 - volatilidade * 20)

    const estruturalFinal =
      estrutural


    resultados.push({
      data: hoje.data,
      score: scoreSwing,
      sinal,
      retorno,

      diagnostico: diagnostico.decisao,
      contexto,
      setup: tipoSetup,

      trendScore,
      momentumFinal,
      riskScore,
      estruturalFinal,
      motivoSaida,
      diasOperacao,
      lucroPerdido,
      tendenciaSegueNaSaida,
    })

    if (drawdownAtual > 18) {
      bloqueiosDefensivo++
    
      console.log(
        "🛑 MODO DEFENSIVO ATIVADO"
      )
    
      cooldown = 5
    }

    i = Math.max(i + 1, j - 3)
  }

  console.log("🛡️ Bloqueios Defensivos:", bloqueiosDefensivo)
  console.log("📉 Bloqueios Score:", bloqueiosScore)

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
  const trades: number[] = []

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
    } else {
      return
    }

    trades.push(lucroTrade)

    console.log(
      "🎯 TRADE:",
      lucroTrade.toFixed(2)
    )

    lucro += lucroTrade
    capital *= (1 + lucroTrade / 100)

    if (capital > pico) {
      pico = capital
    }

    const drawdown =
      (pico - capital) / pico

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  })

  const lucroBruto =
    trades
      .filter(t => t > 0)
      .reduce((a, b) => a + b, 0)

  const prejuizoBruto =
    Math.abs(
      trades
        .filter(t => t < 0)
        .reduce((a, b) => a + b, 0)
    )

  const profitFactor =
    prejuizoBruto > 0
      ? lucroBruto / prejuizoBruto
      : lucroBruto

  const ganhos =
    trades.filter(t => t > 0)

  const perdas =
    trades.filter(t => t < 0)

  const ganhoMedio =
    ganhos.length > 0
      ? ganhos.reduce((a, b) => a + b, 0) / ganhos.length
      : 0

  const perdaMedia =
    perdas.length > 0
      ? Math.abs(perdas.reduce((a, b) => a + b, 0) / perdas.length)
      : 0

  const winRate =
    trades.length > 0
      ? ganhos.length / trades.length
      : 0

  const lossRate =
    trades.length > 0
      ? perdas.length / trades.length
      : 0

  let volatilidade = 0
  let sharpe = 0
  let expectancy = 0

  if (trades.length >= 2) {
    const mediaRetornos =
      trades.reduce((a, b) => a + b, 0) / trades.length

    const variancia =
      trades.reduce(
        (acc, r) =>
          acc + Math.pow(r - mediaRetornos, 2),
        0
      ) / (trades.length - 1)

    volatilidade =
      variancia > 0
        ? Math.sqrt(variancia)
        : 0

    sharpe =
      volatilidade > 0
        ? mediaRetornos / volatilidade
        : 0

    expectancy =
      (winRate * ganhoMedio) -
      (lossRate * perdaMedia)
  }

  let perdasConsecutivas = 0
  let maxPerdasConsecutivas = 0

  for (const trade of trades) {
    if (trade < 0) {
      perdasConsecutivas++

      if (perdasConsecutivas > maxPerdasConsecutivas) {
        maxPerdasConsecutivas = perdasConsecutivas
      }
    } else {
      perdasConsecutivas = 0
    }
  }

  console.log("📊 Profit Factor:", profitFactor.toFixed(2))
  console.log("🧠 Expectancy:", expectancy.toFixed(2))
  console.log("📉 Volatilidade:", volatilidade.toFixed(2))
  console.log("⚡ Sharpe:", sharpe.toFixed(2))
  console.log("💀 Max Loss Streak:", maxPerdasConsecutivas)

  return {
    taxaAcerto:
      total > 0
        ? (acertos / total) * 100
        : 0,

    lucroTotal:
      Number(lucro.toFixed(2)),

    lucroMedio:
      total > 0
        ? Number((lucro / total).toFixed(2))
        : 0,

    maxDrawdown:
      Number((maxDrawdown * 100).toFixed(2)),

    capitalFinal:
      Number(capital.toFixed(2)),

    totalTrades: total,

    profitFactor:
      Number(profitFactor.toFixed(2)),

    expectancy:
      Number(expectancy.toFixed(2)),

    volatilidade:
      Number(volatilidade.toFixed(2)),

    sharpe:
      Number(sharpe.toFixed(2)),

    maxPerdasConsecutivas
  }
}