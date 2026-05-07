type Candle = {
    data: string
    preco: number
  }
  
  // 📊 média móvel
  function media(
    precos: number[],
    periodo: number
  ) {
    const slice = precos.slice(-periodo)
  
    const soma =
      slice.reduce((a, b) => a + b, 0)
  
    return soma / periodo
  }
  
  // 📉 drawdown máximo
  function calcularDrawdown(
    precos: number[]
  ) {
  
    let topo = precos[0]
    let maxDrawdown = 0
  
    for (const preco of precos) {
  
      if (preco > topo) {
        topo = preco
      }
  
      const drawdown =
        ((topo - preco) / topo) * 100
  
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }
  
    return maxDrawdown
  }
  
  // 🚀 score estrutural
  export function calcularScoreEstrutural(
    dados: Candle[]
  ) {
  
    const precos =
      dados.map(d => d.preco)
  
    if (precos.length < 220) {
      return 0
    }
  
    let score = 0
  
    const precoAtual =
      precos[precos.length - 1]
  
    // 📊 MM200
    const mm200 =
      media(precos, 200)
  
    // 📈 tendência longa
    if (precoAtual > mm200) {
      score += 25
    }
  
    // 🚀 distância positiva
    const distanciaMM =
      ((precoAtual - mm200) / mm200) * 100
  
    if (distanciaMM > 5) {
      score += 20
    }
  
    // 📈 performance 1 ano
    const precoAno =
      precos[precos.length - 200]
  
    const retornoAno =
      ((precoAtual - precoAno) / precoAno) * 100
  
    if (retornoAno > 15) {
      score += 20
    }
  
    // 🌪️ volatilidade
    let volatilidade = 0
  
    for (let i = 1; i < precos.length; i++) {
  
      volatilidade += Math.abs(
        ((precos[i] - precos[i - 1]) /
          precos[i - 1]) * 100
      )
    }
  
    volatilidade =
      volatilidade / precos.length
  
    if (volatilidade < 2.5) {
      score += 15
    }
  
    // 📉 drawdown
    const drawdown =
      calcularDrawdown(precos)
  
    if (drawdown < 35) {
      score += 10
    }
  
    // 🔥 recuperação
    const fundo =
      Math.min(...precos.slice(-120))
  
    const recuperacao =
      ((precoAtual - fundo) / fundo) * 100
  
    if (recuperacao > 20) {
      score += 10
    }
  
    return score
  }