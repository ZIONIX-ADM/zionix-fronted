import { NextRequest, NextResponse } from "next/server"
import { calcularScoreDiagnostico } from "../../core/score"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { precos, highs, lows, datas, mercado, setor } = body ?? {}

  if (!Array.isArray(precos) || !Array.isArray(highs) || !Array.isArray(lows) || !Array.isArray(datas)) {
    return NextResponse.json(
      { error: "precos, highs, lows e datas são obrigatórios e devem ser arrays" },
      { status: 400 }
    )
  }

  const diagnostico = calcularScoreDiagnostico({
    precos,
    highs,
    lows,
    datas,
    mercado: mercado ?? "neutro",
    setor: setor ?? ""
  })

  return NextResponse.json(diagnostico)
}
