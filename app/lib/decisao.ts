export type NivelExibicao = { label: string; bg: string; color: string; border: string }

const COMPRAR: NivelExibicao = { label: "Comprar", bg: "#dcfce7", color: "#15803d", border: "#86efac" }
const NEUTRO:  NivelExibicao = { label: "Neutro",  bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" }
const EVITAR:  NivelExibicao = { label: "Evitar",  bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" }

export function mapearSinal(sinal: string): NivelExibicao {
  const s = sinal.toLowerCase()
  if (s.includes("compra") || s.includes("comprar") || s === "manter") return COMPRAR
  if (s.includes("aguardar")) return NEUTRO
  return EVITAR
}

export function mapearDecisao(decisao: string): NivelExibicao {
  if (decisao === "comprar" || decisao === "manter") return COMPRAR
  if (decisao === "aguardar") return NEUTRO
  return EVITAR
}

export const FILTROS_3 = ["Todas", "Comprar", "Neutro", "Evitar"] as const
export type Filtro3 = typeof FILTROS_3[number]

export function matchFiltro(sinal: string, filtro: string): boolean {
  return mapearSinal(sinal).label === filtro
}
