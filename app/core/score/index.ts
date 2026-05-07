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

// 🔥 SETOR AUTOMÁTICO (SEM INPUT MANUAL)
function setorParaScore(setor?: string) {
  if (!setor) return 0.5

  const s = setor.toLowerCase()

  if (s.includes("financeiro") || s.includes("energia") || s.includes("tecnologia")) return 1
  if (s.includes("varejo") || s.includes("consumo")) return 0.3

  return 0.5
}

// 📊 CENÁRIO (DESCRIÇÃO)
export function gerarCenario(variacao: number) {
  if (variacao > 1) return "alta consistente"
  if (variacao > 0) return "leve alta"
  if (variacao < -1) return "queda consistente"
  if (variacao < 0) return "leve queda"
  return "lateral"
}

// 🎯 SINAL (DECISÃO)
export function gerarSinal(score: number) {
  if (score >= 70) return "entrada forte"
  if (score >= 55) return "entrada"
  if (score >= 45) return "neutro"
  if (score >= 30) return "venda"
  return "venda forte"
}

// 🧠 SCORE PRINCIPAL (VERSÃO FINAL MELHORADA)
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

  // 📈 MOMENTUM (menos sensível a ruído)
  const momentum = Math.pow(normalizar(variacao, -5, 5), 1.1)

  // ⚠️ RISCO MAIS REALISTA (penaliza mais volatilidade)
  const riscoBruto = normalizar(volatilidade, 0, 8)
  const risco = 1 - Math.pow(riscoBruto, 1.5)

  // 📊 CONTEXTO
  const tendenciaScore = tendenciaParaScore(tendencia)
  const setorScore = setorParaScore(setor)

  // ⚖️ PESOS AJUSTADOS (mais realistas)
  const scoreFinal =
    momentum * 0.4 +
    risco * 0.3 +
    tendenciaScore * 0.2 +
    setorScore * 0.1

  return Math.round(scoreFinal * 100)
}