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

/**
 * EMA (Exponential Moving Average) — base para MACD.
 * Inicializa com SMA dos primeiros `periodo` candles, depois aplica EMA iterativo.
 */
export function calcularEMA(precos: number[], periodo: number, index: number): number | null {
  if (index < periodo - 1 || precos.length < periodo) return null
  const k = 2 / (periodo + 1)
  let ema = 0
  for (let i = 0; i < periodo; i++) ema += precos[i]
  ema /= periodo
  for (let i = periodo; i <= index; i++) {
    ema = precos[i] * k + ema * (1 - k)
  }
  return ema
}

/**
 * MACD (12, 26, 9).
 * Retorna {macd, signal, histogram} — todos valores contínuos em unidade de preço.
 * Normalizar pelo ATR antes de usar em scores.
 */
export function calcularMACD(
  precos: number[],
  index: number
): { macd: number; signal: number; histogram: number } | null {
  // Precisa de 26 pts (lento) + 9 pts (signal warmup)
  if (index < 34) return null

  // Calcula MACD nos últimos 9 pontos para derivar a signal line
  const macdSeries: number[] = []
  for (let j = index - 8; j <= index; j++) {
    const e12 = calcularEMA(precos, 12, j)
    const e26 = calcularEMA(precos, 26, j)
    if (e12 === null || e26 === null) return null
    macdSeries.push(e12 - e26)
  }

  // EMA(9) da série MACD = signal line
  const k9 = 2 / (9 + 1)
  let signal = macdSeries[0]
  for (let j = 1; j < macdSeries.length; j++) {
    signal = macdSeries[j] * k9 + signal * (1 - k9)
  }

  const macd = macdSeries[macdSeries.length - 1]
  return { macd, signal, histogram: macd - signal }
}

/**
 * ADX (Average Directional Index) com Wilder smoothing.
 * Retorna {adx, plusDI, minusDI} — adx em 0-100.
 * adx > 25 = tendência significativa; adx > 40 = tendência forte.
 */
export function calcularADX(
  dados: Candle[],
  periodo: number,
  index: number
): { adx: number; plusDI: number; minusDI: number } | null {
  if (index < periodo * 2) return null

  const TR: number[] = []
  const pDM: number[] = []
  const mDM: number[] = []

  for (let i = 1; i <= index; i++) {
    const curr = dados[i]
    const prev = dados[i - 1]
    if (!curr || !prev) return null
    const high = curr.high ?? curr.preco
    const low = curr.low ?? curr.preco
    const prevHigh = prev.high ?? prev.preco
    const prevLow = prev.low ?? prev.preco
    const prevClose = prev.close ?? prev.preco

    TR.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
    const upMove = high - prevHigh
    const downMove = prevLow - low
    pDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    mDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
  }

  // Wilder smoothing (alpha = 1/periodo)
  const alpha = 1 / periodo
  let sTR = TR.slice(0, periodo).reduce((a, b) => a + b, 0)
  let sPDM = pDM.slice(0, periodo).reduce((a, b) => a + b, 0)
  let sMDM = mDM.slice(0, periodo).reduce((a, b) => a + b, 0)

  const DX: number[] = []
  for (let i = periodo; i < TR.length; i++) {
    sTR = sTR * (1 - alpha) + TR[i]
    sPDM = sPDM * (1 - alpha) + pDM[i]
    sMDM = sMDM * (1 - alpha) + mDM[i]
    const pdi = sTR > 0 ? (100 * sPDM / sTR) : 0
    const mdi = sTR > 0 ? (100 * sMDM / sTR) : 0
    DX.push((pdi + mdi) > 0 ? 100 * Math.abs(pdi - mdi) / (pdi + mdi) : 0)
  }

  if (DX.length < periodo) return null

  // ADX = Wilder smooth de DX
  let adx = DX.slice(0, periodo).reduce((a, b) => a + b, 0) / periodo
  for (let i = periodo; i < DX.length; i++) {
    adx = adx * (1 - alpha) + DX[i] * alpha
  }

  const pdi = sTR > 0 ? (100 * sPDM / sTR) : 0
  const mdi = sTR > 0 ? (100 * sMDM / sTR) : 0
  return { adx, plusDI: pdi, minusDI: mdi }
}

/**
 * Stochastic Oscillator (%K suavizado, %D) com parâmetros (14, 3, 3).
 * Retorna {k, d} — ambos em 0-100.
 * k: SMA(3) do %K bruto (14 períodos). d: SMA(3) de k.
 * Normalizar para score: stochNorm = (k - 50) / 50 → range -1..+1.
 */
export function calcularStochastic(
  dados: Candle[],
  index: number,
  periodoK = 14,
  smoothK = 3,
  smoothD = 3
): { k: number; d: number } | null {
  // precisa de periodoK + smoothK + smoothD - 2 candles
  const minIndex = periodoK + smoothK + smoothD - 3
  if (index < minIndex) return null

  // raw %K para os últimos smoothK + smoothD - 1 candles (para suavizar)
  const rawKLen = smoothK + smoothD - 1
  const rawK: number[] = []

  for (let j = index - rawKLen + 1; j <= index; j++) {
    let lowest = Infinity
    let highest = -Infinity
    for (let k = j - periodoK + 1; k <= j; k++) {
      const c = dados[k]
      if (!c) return null
      const h = c.high ?? c.preco
      const l = c.low ?? c.preco
      if (h > highest) highest = h
      if (l < lowest) lowest = l
    }
    if (highest === lowest) {
      rawK.push(50)
    } else {
      const close = dados[j].close ?? dados[j].preco
      rawK.push(((close - lowest) / (highest - lowest)) * 100)
    }
  }

  // SMA(smoothK) da série rawK → série kSeries
  const kSeries: number[] = []
  for (let j = smoothK - 1; j < rawK.length; j++) {
    let sum = 0
    for (let k = j - smoothK + 1; k <= j; k++) sum += rawK[k]
    kSeries.push(sum / smoothK)
  }

  if (kSeries.length < smoothD) return null

  // SMA(smoothD) de kSeries → %D
  let dSum = 0
  for (let j = kSeries.length - smoothD; j < kSeries.length; j++) dSum += kSeries[j]
  const d = dSum / smoothD
  const k = kSeries[kSeries.length - 1]

  return { k, d }
}

/**
 * CCI — Commodity Channel Index (20 períodos).
 * CCI = (TP - SMA20_TP) / (0.015 * MeanDeviation)
 * TP = (high + low + close) / 3.
 * Retorna valor adimensional; range típico -200..+200, sem limites teóricos.
 * Normalizar para score: cciNorm = clamp(cci / 200, -1, +1).
 */
export function calcularCCI(
  dados: Candle[],
  index: number,
  periodo = 20
): number | null {
  if (index < periodo - 1) return null

  const tps: number[] = []
  for (let i = index - periodo + 1; i <= index; i++) {
    const c = dados[i]
    if (!c) return null
    const h = c.high ?? c.preco
    const l = c.low ?? c.preco
    const cl = c.close ?? c.preco
    tps.push((h + l + cl) / 3)
  }

  const sma = tps.reduce((a, b) => a + b, 0) / periodo
  const meanDev = tps.reduce((a, b) => a + Math.abs(b - sma), 0) / periodo

  if (meanDev === 0) return 0
  return (tps[tps.length - 1] - sma) / (0.015 * meanDev)
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
