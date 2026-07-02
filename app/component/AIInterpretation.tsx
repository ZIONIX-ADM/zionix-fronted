"use client"

type Props = {
  texto: string
  loading?: boolean
}

export default function AIInterpretation({ texto, loading }: Props) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Leitura da IA</p>
        {loading && (
          <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 border-t-yellow-500 animate-spin" />
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded-full w-full animate-pulse" />
          <div className="h-3 bg-gray-100 rounded-full w-4/5 animate-pulse" />
        </div>
      ) : (
        <p className="text-gray-700 leading-relaxed text-sm">{texto}</p>
      )}
    </div>
  )
}
