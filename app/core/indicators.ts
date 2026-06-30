export type Candle = {
  data: string
  preco: number
  open: number
  high: number
  low: number
  close: number
}

export function media(
  precos: number[],
  periodo: number,
  index: number
): number | null {
  if (index < periodo) return null
  let soma = 0
  for (let i = index - periodo; i < index; i++) {
    soma += precos[i]
  }
  return soma / periodo
}

export function calcularRSI(
  precos: number[],
  periodo: number,
  index: number
): number | null {
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

export function calcularATR(
  dados: Candle[],
  periodo: number,
  index: number
): number {
  if (index < periodo) return 0
  const trs: number[] = []
  for (let i = index - periodo + 1; i <= index; i++) {
    const candle = dados[i]
    const anterior = dados[i - 1]
    if (!candle || !anterior) continue
    const high = candle.high ?? candle.preco ?? candle.close
    const low = candle.low ?? candle.preco ?? candle.close
    const closeAnterior = anterior.close ?? anterior.preco
    const tr = Math.max(
      high - low,
      Math.abs(high - closeAnterior),
      Math.abs(low - closeAnterior)
    )
    if (!Number.isNaN(tr)) trs.push(tr)
  }
  if (trs.length === 0) return 0
  return trs.reduce((a, b) => a + b, 0) / trs.length
}

export function classificarContexto(
  precos: number[],
  i: number
): string {
  const mm9 = media(precos, 9, i)
  const mm21 = media(precos, 21, i)
  const mm50 = media(precos, 50, i)
  const mm21Anterior = media(precos, 21, i - 5)
  if (!mm9 || !mm21 || !mm50 || !mm21Anterior) return "neutro"
  const distancia = ((mm9 - mm21) / mm21) * 100
  const slopeMM21 = ((mm21 - mm21Anterior) / mm21) * 100
  if (mm9 > mm21 && mm21 > mm50 && distancia > 1.5 && slopeMM21 > 0.3)
    return "tendencia_forte"
  if (mm9 > mm21 && mm21 >= mm50 && distancia < 1)
    return "pullback"
  if (Math.abs(distancia) < 0.3)
    return "lateral"
  if (mm9 < mm21 && mm21 < mm50)
    return "bearish"
  return "neutro"
}

// Ativos com perfil commodity onshore/news-driven (ex: RECV3, PRIO3) tendem a gerar
// falsos positivos aqui — o alinhamento de MMs ocorre mas o momentum não se sustenta
// porque o preço é dirigido por notícias pontuais, não por tendência estrutural.
// Backtest 2024 mostrou PF ~0 para esses ativos. Não usar sem validação adicional.
export function trendEngine(
  precos: number[],
  dados: Candle[],
  i: number
) {
  const mm9 = media(precos, 9, i)
  const mm21 = media(precos, 21, i)
  const mm50 = media(precos, 50, i)
  const mm21Anterior = media(precos, 21, i - 5)
  const mm50Anterior = media(precos, 50, i - 5)
  if (!mm9 || !mm21 || !mm50 || !mm21Anterior || !mm50Anterior) return null
  const distanciaMM = ((mm9 - mm21) / mm21) * 100
  const slopeMM21 = ((mm21 - mm21Anterior) / mm21Anterior) * 100
  const slopeMM50 = ((mm50 - mm50Anterior) / mm50Anterior) * 100
  const confirmacaoCandle = precos[i] > precos[i - 1]
  const tendenciaForte =
    mm9 > mm21 &&
    mm21 > mm50 &&
    distanciaMM > 2 &&
    slopeMM21 > 0.5 &&
    slopeMM50 > 0
  const acimaEstrutura = precos[i] > mm50
  if (tendenciaForte && acimaEstrutura && confirmacaoCandle) {
    const atr = calcularATR(dados, 14, i)
    if (!atr) return null
    return { tipo: "trend", stop: -(atr * 2), trailing: atr * 1.5 }
  }
  return null
}

export function pullbackEngine(
  precos: number[],
  dados: Candle[],
  i: number
) {
  const mm9 = media(precos, 9, i)
  const mm21 = media(precos, 21, i)
  const mm50 = media(precos, 50, i)
  const mm21Anterior = media(precos, 21, i - 5)
  if (!mm9 || !mm21 || !mm50 || !mm21Anterior) return null
  const tendenciaPrincipal = mm21 >= mm50
  const precoPertoMM21 =
    precos[i] <= mm21 * 1.015 && precos[i] >= mm21 * 0.97
  const retomada = precos[i] > precos[i - 1]
  const inclinacaoPositiva = mm21 > mm21Anterior
  if (tendenciaPrincipal && precoPertoMM21 && retomada && inclinacaoPositiva) {
    const atr = calcularATR(dados, 14, i)
    if (!atr) return null
    return { tipo: "pullback", stop: -(atr * 1.2), trailing: atr }
  }
  return null
}
