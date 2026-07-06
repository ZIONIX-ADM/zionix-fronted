export type Decisao =
  | "comprar"
  | "manter"
  | "aguardar"
  | "cautela"
  | "evitar"

export function gerarDiagnosticoDiario({
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
  forca,
  macdNorm = 0,
  adxValue = 15,
  adxDirecaoBull = true,
  stochNorm = 0,
  cciNorm = 0,
}: {
  contexto: string
  setup: { tipo: string }
  trendQuality: number
  momentumScore: number
  compressaoScore: number
  estrutural: number
  volatilidade: number
  rsi: number
  mercado: string
  condicoesEntrada: number  // 0, 1, 2 ou 3 condições atendidas (era boolean)
  forca: number
  /** MACD histogram normalizado pelo ATR (adimensional). Positivo = momentum bullish. */
  macdNorm?: number
  /** ADX(14) em 0-100. >25 = tendência relevante, >40 = forte. Default 25 = neutro. */
  adxValue?: number
  /** true se +DI > -DI (tendência de alta). Inverte contribuição ADX se falso. */
  adxDirecaoBull?: boolean
  /** Stochastic %K suavizado (14,3,3) normalizado: (k-50)/50 → -1..+1. 0 = neutro. */
  stochNorm?: number
  /** CCI(20) normalizado: clamp(cci/200, -1, +1). 0 = neutro. */
  cciNorm?: number
}): { score: number; decisao: Decisao } {
  let score = 30

  if (contexto === "tendencia_forte") score += 22
  if (contexto === "pullback") score += 14
  if (contexto === "lateral") score -= 6
  if (contexto === "bearish") score -= 18

  if (setup.tipo === "trend") score += 12
  if (setup.tipo === "pullback") score += 10

  const scoreTecnico =
    trendQuality * 0.50 +
    momentumScore * 0.35 +
    compressaoScore * 0.15

  const scoreFundacao =
    estrutural * 0.70 +
    forca * 0.30

  score += scoreTecnico * 0.20
  score += scoreFundacao * 0.15

  score += Math.max(0, Math.min(5, (forca - 70) / 30 * 5))

  score -= Math.max(0, Math.min(16, (volatilidade - 2) / 5 * 16))

  score -= Math.max(0, Math.min(5, (35 - rsi) / 15 * 5))

  if (contexto !== "tendencia_forte")
    score -= Math.max(0, Math.min(5, (rsi - 85) / 15 * 5))

  if (mercado === "bull") score += 5

  if (mercado === "bear") {
    score -= 8
    if (contexto !== "tendencia_forte" && contexto !== "pullback") score -= 5
  }

  // MACD: momentum contínuo. histogram normalizado pelo ATR (adimensional).
  // Range esperado: -3 a +3. Mapeado para -8 a +10 pts no score.
  const macdContrib = Math.max(-8, Math.min(10, macdNorm * 4))
  score += macdContrib

  // ADX: força da tendência. Contribui 0-12 pts quando tendência é sólida (>25).
  // Sem contribuição se ADX < 15 (mercado sem direção). Penalidade suave se direção
  // é baixista (+DI < -DI) — ativo com força bearish não deve ganhar bônus de ADX.
  const adxBase = Math.max(0, Math.min(12, (adxValue - 15) / 2.5))
  score += adxDirecaoBull ? adxBase : -adxBase * 0.5

  // Stochastic %K (14,3,3): momentum de curto prazo.
  // stochNorm = (k - 50) / 50 → -1..+1. Mapeado para -6..+6 pts.
  // Região oversold (k<20, norm<-0.6) confirma momentum fraco; overbought (k>80, norm>0.6) confirma força.
  score += Math.max(-6, Math.min(6, stochNorm * 6))

  // CCI(20): desvio do preço típico em relação à sua média. Captura impulsos de curto/médio prazo.
  // cciNorm = clamp(cci/200, -1, +1). Mapeado para -6..+6 pts.
  score += Math.max(-6, Math.min(6, cciNorm * 6))

  // Correção 2: penalidade gradual por condições de entrada não atendidas.
  // Substitui o hard cap em 67 — escala suave sem corte abrupto.
  // 3/3 → +5 pts (entrada totalmente confirmada)
  // 2/3 → -3 pts (mesmo que o antigo penalidade base)
  // 1/3 → -6 pts
  // 0/3 → -9 pts (máximo: 3x o antigo -3, sem cap artificial)
  if (condicoesEntrada === 3) {
    score += 5
  } else {
    score -= (3 - condicoesEntrada) * 3
  }

  score = Math.max(0, Math.min(100, score))

  // Thresholds dinâmicos por regime. Gaps fixos: comprar-manter=16, manter-aguardar=10, aguardar-cautela=12.
  // Calibrados para o motor com MACD+ADX+Stoch+CCI, que comprime scores ~25 pts vs motor legado.
  const tManter  = mercado === "bull" ? 55 : mercado === "bear" ? 40 : 46
  const tComprar = tManter + 16
  const tAguardar = tManter - 10
  const tCautela  = tAguardar - 12

  let decisao: Decisao = "aguardar"
  if (score >= tComprar)       decisao = "comprar"
  else if (score >= tManter)   decisao = "manter"
  else if (score >= tAguardar) decisao = "aguardar"
  else if (score >= tCautela)  decisao = "cautela"
  else                         decisao = "evitar"

  return { score, decisao }
}
