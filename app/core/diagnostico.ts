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
  entradaConfirmada,
  forca
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
  entradaConfirmada: boolean
  forca: number
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

  if (entradaConfirmada) score += 5
  else score -= 3

  score = Math.max(0, Math.min(100, score))

  if (!entradaConfirmada) score = Math.min(score, 67)

  let decisao: Decisao = "aguardar"
  if (score >= 68) decisao = "comprar"
  else if (score >= 52) decisao = "manter"
  else if (score >= 42) decisao = "aguardar"
  else if (score >= 30) decisao = "cautela"
  else decisao = "evitar"

  return { score, decisao }
}
