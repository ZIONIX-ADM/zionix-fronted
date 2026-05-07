type Props = {
    texto: string
  }
  
  export default function AIInterpretation({
    texto
  }: Props) {
  
    return (
      <div className="bg-white p-5 rounded-2xl shadow-md">
  
        <p className="text-xs text-gray-400 uppercase mb-2">
          Leitura da IA
        </p>
  
        <p className="text-gray-700 leading-relaxed">
          {texto}
        </p>
  
      </div>
    )
  }