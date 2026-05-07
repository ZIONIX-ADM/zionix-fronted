type Props = {
    ticker: string
    sinal: string
    score: number
  }
  
  export default function RankingCard({
    ticker,
    sinal,
    score
  }: Props) {
  
    const cor =
      score >= 70 ? "text-green-600" :
      score >= 55 ? "text-yellow-600" :
      "text-red-600"
  
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between border border-gray-100">
  
        <div>
          <p className="text-sm text-gray-400">
            {ticker}
          </p>
  
          <p className={`font-medium ${cor}`}>
            {sinal}
          </p>
        </div>
  
        <div className="text-right">
          <p className="text-xs text-gray-400">
            Score
          </p>
  
          <p className="text-xl font-bold">
            {score}
          </p>
        </div>
  
      </div>
    )
  }