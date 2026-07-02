import {
  type Candle,
  media,
  calcularRSI,
  calcularATR,
  classificarContexto,
  trendEngine,
  pullbackEngine
} from "../indicators"
import { gerarDiagnosticoDiario } from "../diagnostico"
import { calcularScoreEstrutural } from "../estrutural"

// 🧠 SCORE UNIFICADO — mesma lógica do backtest
export function calcularScoreDiagnostico({
  precos,
  highs,
  lows,
  datas,
  mercado,
  setor
}: {
  precos: number[]
  highs: number[]
  lows: number[]
  datas: string[]
  mercado: string
  setor: string
}): { score: number; decisao: string } {
  if (precos.length < 55) return { score: 0, decisao: "aguardar" }

  const dados: Candle[] = precos.map((preco, idx) => ({
    data: datas[idx] ?? "",
    preco,
    open: preco,
    high: highs[idx] ?? preco,
    low: lows[idx] ?? preco,
    close: preco
  }))

  const i = precos.length - 1

  const mm9 = media(precos, 9, i)
  const mm21 = media(precos, 21, i)
  const mm50 = media(precos, 50, i)
  const mm50Anterior = media(precos, 50, i - 5)
  const preco5DiasAtras = precos[i - 5]

  if (!mm9 || !mm21 || !mm50 || !mm50Anterior || !preco5DiasAtras) {
    return { score: 0, decisao: "aguardar" }
  }

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

  const rsi = calcularRSI(precos, 14, i)
  if (!rsi) return { score: 0, decisao: "aguardar" }

  const estrutural = calcularScoreEstrutural(dados)

  const forca = forcaFromSetor(setor)

  const ontem = precos[i - 1]
  const condicoesEntrada = (
    (precos[i] > ontem ? 1 : 0) +
    (mm9 > mm21 ? 1 : 0) +
    (precos[i] > mm50 ? 1 : 0)
  )

  return gerarDiagnosticoDiario({
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
    forca
  })
}

function forcaFromSetor(_setor: string): number {
  // Retorna neutro para todos os setores até termos dados reais por ativo.
  // O viés fixo por setor (Financeiro=90, Varejo=35 etc.) causava até ±6 pts
  // de distorção sistemática independente do ativo específico.
  return 50
}

// 🔒 NORMALIZAÇÃO SEGURA + CLAMP
function normalizar(valor: number, min: number, max: number) {
  if (min === max) return 0.5

  const normalizado = (valor - min) / (max - min)

  return Math.max(0, Math.min(1, normalizado))
}

// 🔄 CONVERSÃO DE TENDÊNCIA
function tendenciaParaScore(t?: string) {
  switch (t) {
    case "alta": return 1
    case "queda": return 0
    case "lateral": return 0.5
    default: return 0.5
  }
}

// 🔥 SETOR AUTOMÁTICO
function setorParaScore(setor?: string) {
  if (!setor) return 0.5

  const s = setor.toLowerCase()

  if (
    s.includes("financeiro") ||
    s.includes("energia") ||
    s.includes("tecnologia")
  ) return 1

  if (
    s.includes("varejo") ||
    s.includes("consumo")
  ) return 0.3

  return 0.5
}

// 📊 CENÁRIO
export function gerarCenario(variacao: number) {
  if (variacao > 1) return "alta consistente"
  if (variacao > 0) return "leve alta"
  if (variacao < -1) return "queda consistente"
  if (variacao < 0) return "leve queda"

  return "lateral"
}

// 🎯 SINAL OPERACIONAL ANTIGO
export function gerarSinal(score: number) {
  if (score >= 70) return "entrada forte"
  if (score >= 55) return "entrada"
  if (score >= 45) return "neutro"
  if (score >= 30) return "venda"

  return "venda forte"
}

// 🧠 RECOMENDAÇÃO PARA O MVP
export function gerarRecomendacao(score: number) {

  if (score >= 85) {
    return "Forte compra"
  }

  if (score >= 70) {
    return "Compra"
  }

  if (score >= 55) {
    return "Compra moderada"
  }

  if (score >= 40) {
    return "Aguardar confirmação"
  }

  if (score >= 25) {
    return "Cautela"
  }

  return "Evitar"
}

// 🧠 SCORE PRINCIPAL
export function calcularScore({
  variacao = 0,
  volatilidade = 5,
  tendencia,
  setor
}: {
  variacao?: number
  volatilidade?: number
  tendencia?: string
  setor?: string
}) {
  const momentum =
    Math.pow(normalizar(variacao, -5, 5), 1.1)

  const riscoBruto =
    normalizar(volatilidade, 0, 8)

  const risco =
    1 - Math.pow(riscoBruto, 1.5)

  const tendenciaScore =
    tendenciaParaScore(tendencia)

  const setorScore =
    setorParaScore(setor)

  const scoreFinal =
    momentum * 0.4 +
    risco * 0.3 +
    tendenciaScore * 0.2 +
    setorScore * 0.1

  return Math.round(scoreFinal * 100)
}