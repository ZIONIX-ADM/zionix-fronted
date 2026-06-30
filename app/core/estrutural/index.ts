type Candle = {
  data: string
  preco: number
}

function media(precos: number[], periodo: number) {
  const slice = precos.slice(-periodo)
  return slice.reduce((a, b) => a + b, 0) / periodo
}

function calcularDrawdown(precos: number[]) {
  let topo = precos[0]
  let maxDrawdown = 0
  for (const preco of precos) {
    if (preco > topo) topo = preco
    const drawdown = ((topo - preco) / topo) * 100
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }
  return maxDrawdown
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function calcularScoreEstrutural(dados: Candle[]) {
  const precos = dados.map(d => d.preco)

  if (precos.length < 220) return 0

  const precoAtual = precos[precos.length - 1]
  const mm200 = media(precos, 200)

  const distanciaMM = ((precoAtual - mm200) / mm200) * 100

  const precoAno = precos[precos.length - 200]
  const retornoAno = ((precoAtual - precoAno) / precoAno) * 100

  let volatilidade = 0
  for (let i = 1; i < precos.length; i++) {
    volatilidade += Math.abs(((precos[i] - precos[i - 1]) / precos[i - 1]) * 100)
  }
  volatilidade = volatilidade / precos.length

  const drawdown = calcularDrawdown(precos)

  const fundo = Math.min(...precos.slice(-120))
  const recuperacao = ((precoAtual - fundo) / fundo) * 100

  // posição vs MM200: proporcional à distância, penaliza se abaixo
  const scorePos = clamp(distanciaMM * 2.5, -25, 25)
  // distância positiva da MM200: proporcional até 10%, teto 20
  const scoreDist = clamp(distanciaMM * 2, 0, 20)
  // retorno 1 ano: proporcional, penaliza negativo leve
  const scoreRetorno = clamp(retornoAno * 0.8, -10, 20)
  // volatilidade: decresce linearmente acima de 3.5%
  const scoreVol = clamp((3.5 - volatilidade) * 6, 0, 15)
  // drawdown: melhor abaixo de 45%, zera em 45%+
  const scoreDD = clamp((45 - drawdown) * 0.4, 0, 10)
  // recuperação: proporcional até ~33%
  const scoreRec = clamp(recuperacao * 0.3, 0, 10)

  const total = scorePos + scoreDist + scoreRetorno + scoreVol + scoreDD + scoreRec

  return Math.max(0, Math.min(100, total))
}
