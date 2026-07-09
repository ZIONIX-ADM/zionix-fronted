"use client"

import { useEffect, useState } from "react"
import Tooltip from "../component/Tooltip"
import { TOOLTIPS } from "../component/tooltips"
import { mapearDecisao, mapearSinal, FILTROS_3 } from "../lib/decisao"

type AtivoCard = { ticker: string; nome?: string; score: number; sinal: string; decisao: string }

type Analises = {
  mercado: string
  total_ativos: number
  por_decisao: Record<string, number>
  distribuicao: { faixa: string; count: number }[]
  por_setor: { setor: string; count: number; score_medio: number; top_ticker: string }[]
  destaques: {
    top_momentum: { ticker: string; score: number; contexto: string; sinal: string }[]
    top_estrutural: { ticker: string; score: number; contexto: string; sinal: string }[]
  }
}

const MERCADO_INFO: Record<string, { label: string; cor: string; desc: string }> = {
  bull:   { label: "Alta", cor: "#1a7a45", desc: "IBOV acima das médias móveis — ambiente favorável" },
  bear:   { label: "Baixa", cor: "#a12d2d", desc: "IBOV abaixo das médias móveis — ambiente de risco" },
  neutro: { label: "Neutro", cor: "#555", desc: "Mercado sem tendência definida — cautela recomendada" },
}

const C = "#C9A84C"
const DARK = "#0a0a0a"
const MW = { maxWidth: 780, margin: "0 auto", padding: "0 24px" }
const FILTROS_ANALISES = ["Todos", ...FILTROS_3.slice(1)] as const

export default function AnalisesPage() {
  const [data, setData] = useState<Analises | null>(null)
  const [ativos, setAtivos] = useState<AtivoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string | null>(null)

  useEffect(() => {
    const dedup = (arr: AtivoCard[]) => Array.from(
      new Map(arr.map(a => [a.ticker.replace(/\.SA$/i, ""), a])).values()
    )

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analises`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranking?limite=500`).then(r => r.json()),
    ]).then(([analises, ranking]) => {
      if (analises && !analises.erro && analises.distribuicao) setData(analises)
      const lista: AtivoCard[] = ranking?.ativos ?? (Array.isArray(ranking) ? ranking : [])
      setAtivos(dedup(lista))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const ativosFiltrados = filtro
    ? ativos.filter(a => mapearDecisao(a.decisao).label === filtro)
    : []

  const counts: Record<string, number> = {
    Comprar: ativos.filter(a => mapearDecisao(a.decisao).label === "Comprar").length,
    Neutro:  ativos.filter(a => mapearDecisao(a.decisao).label === "Neutro").length,
    Evitar:  ativos.filter(a => mapearDecisao(a.decisao).label === "Evitar").length,
  }

  const mercadoInfo = data ? (MERCADO_INFO[data.mercado] ?? MERCADO_INFO.neutro) : null
  const maxFaixa = data ? Math.max(...data.distribuicao.map(f => f.count)) : 1
  const maxSetor = data ? Math.max(...data.por_setor.map(s => s.score_medio)) : 1
  const temSetores = data ? data.por_setor.some(s => s.setor !== "Outros") : false

  return (
    <div style={{ minHeight: "100vh", background: "#F4F2EC", fontFamily: "var(--font-inter), Inter, sans-serif" }}>

      {/* HERO */}
      <section style={{ background: DARK, paddingBottom: 48 }}>
        <div style={{ ...MW, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 56, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: `1px solid ${C}`, borderRadius: 999,
            padding: "6px 16px", marginBottom: 20,
          }}>
            <span style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em" }}>ANÁLISE DO MERCADO</span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-manrope), Manrope, sans-serif",
            fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            color: "#fff", lineHeight: 1.1, marginBottom: 12,
          }}>
            Panorama completo da B3
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 380 }}>
            Agregações em tempo real de {data?.total_ativos ?? (ativos.length || "—")} ativos analisados.
          </p>
        </div>
      </section>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", color: "#aaa", fontSize: 14 }}>
          Carregando análises...
        </div>
      )}

      {!loading && (data || ativos.length > 0) && (
        <div style={{ ...MW, paddingTop: 40, paddingBottom: 80, display: "flex", flexDirection: "column", gap: 36 }}>

          {/* 1. PULSO DO MERCADO */}
          <section>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#999", marginBottom: 14 }}>PULSO DO MERCADO</p>

            {/* Regime card */}
            {mercadoInfo && data && (
            <div style={{
              background: "#fff", borderRadius: 20, border: "1px solid #ebebeb",
              padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, marginBottom: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: mercadoInfo.cor + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, color: mercadoInfo.cor,
              }}>
                {data.mercado === "bull" ? "↑" : data.mercado === "bear" ? "↓" : "→"}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#111", display: "flex", alignItems: "center", gap: 6 }}>
                  Mercado em{" "}
                  <span style={{ color: mercadoInfo.cor }}>{mercadoInfo.label}</span>
                  <Tooltip text={TOOLTIPS.regimeMercado} position="bottom" />
                </p>
                <p style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>{mercadoInfo.desc}</p>
              </div>
            </div>
            )}

            {/* Filtros por decisão */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FILTROS_ANALISES.map(f => {
                const isTodos = f === "Todos"
                const nivel = !isTodos ? mapearDecisao(f === "Comprar" ? "comprar" : f === "Neutro" ? "aguardar" : "evitar") : null
                const count = !isTodos ? (counts[f] ?? 0) : null
                const isActive = isTodos ? filtro === null : filtro === f
                return (
                  <button
                    key={f}
                    onClick={() => setFiltro(isTodos || isActive ? null : f)}
                    style={{
                      padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: "1px solid",
                      background: isActive ? (nivel?.color ?? DARK) : "#fff",
                      color: isActive ? "#fff" : "#555",
                      borderColor: isActive ? (nivel?.color ?? DARK) : "#ddd",
                    }}
                  >
                    {isTodos ? `Todos (${ativos.length || (data?.total_ativos ?? "—")})` : `${f} (${count})`}
                  </button>
                )
              })}
            </div>

            {/* Lista filtrada */}
            {filtro && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {ativosFiltrados.map(a => {
                  const nivel = mapearDecisao(a.decisao)
                  return (
                    <div key={a.ticker} style={{
                      background: "#fff", borderRadius: 16, border: "1px solid #ebebeb",
                      padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: DARK, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ color: C, fontSize: 11, fontWeight: 800 }}>{a.ticker.replace(/\.SA$/i, "").slice(0, 3)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: "#111", fontSize: 13 }}>{a.ticker.replace(/\.SA$/i, "")}</p>
                        {a.nome && <p style={{ fontSize: 11, color: "#aaa", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</p>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: nivel.bg, color: nivel.color, border: `1px solid ${nivel.border}`, flexShrink: 0 }}>
                        {nivel.label}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#111", minWidth: 28, textAlign: "right", fontFamily: "var(--font-manrope), sans-serif" }}>
                        {Math.round(a.score)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 2. DISTRIBUIÇÃO DE SCORES */}
          {data && <section>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#999", marginBottom: 14 }}>DISTRIBUIÇÃO DE SCORES</p>
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ebebeb", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              {data.distribuicao.map((f, i) => {
                const opacity = [1, 0.8, 0.6, 0.45][i] ?? 0.4
                return (
                  <div key={f.faixa} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "#aaa", width: 52, flexShrink: 0 }}>{f.faixa}</span>
                    <div style={{ flex: 1, height: 20, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{
                        height: 20, borderRadius: 999,
                        width: `${(f.count / maxFaixa) * 100}%`,
                        background: C, opacity,
                        transition: "width .4s",
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#333", width: 28, textAlign: "right", flexShrink: 0 }}>{f.count}</span>
                  </div>
                )
              })}
            </div>
          </section>}

          {/* 3. POR SETOR */}
          {data && temSetores && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#999", marginBottom: 14 }}>POR SETOR</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.por_setor.slice(0, 8).map(s => (
                  <div key={s.setor} style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #ebebeb",
                    padding: "14px 18px", display: "flex", alignItems: "center", gap: 16,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: "#111", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.setor}</p>
                      <p style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{s.count} ativos · destaque: {s.top_ticker}</p>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#111", fontFamily: "var(--font-manrope), sans-serif" }}>{s.score_medio}</p>
                      <div style={{ marginTop: 4, height: 4, background: "#f0f0f0", borderRadius: 99, width: 56 }}>
                        <div style={{ height: 4, borderRadius: 99, background: C, width: `${(s.score_medio / maxSetor) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. DESTAQUES */}
          {data && <section>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#999", marginBottom: 14 }}>DESTAQUES</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ebebeb", padding: 20 }}>
                <p style={{ fontSize: 11, color: "#aaa", marginBottom: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                  Top Momentum <Tooltip text={TOOLTIPS.momentum} position="bottom" />
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.destaques.top_momentum.map(a => (
                    <div key={a.ticker} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: DARK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: C, fontSize: 10, fontWeight: 800 }}>{a.ticker.replace(/\.SA$/i, "").slice(0, 3)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: "#111", fontSize: 12 }}>{a.ticker.replace(/\.SA$/i, "")}</p>
                        <p style={{ fontSize: 11, color: "#aaa" }}>{a.sinal}</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#111", flexShrink: 0, fontFamily: "var(--font-manrope), sans-serif" }}>
                        {Math.round(a.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ebebeb", padding: 20 }}>
                <p style={{ fontSize: 11, color: "#aaa", marginBottom: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                  Top Estrutural <Tooltip text={TOOLTIPS.estrutural} position="bottom" />
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.destaques.top_estrutural.map(a => (
                    <div key={a.ticker} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: DARK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: C, fontSize: 10, fontWeight: 800 }}>{a.ticker.replace(/\.SA$/i, "").slice(0, 3)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: "#111", fontSize: 12 }}>{a.ticker.replace(/\.SA$/i, "")}</p>
                        <p style={{ fontSize: 11, color: "#aaa" }}>{a.sinal}</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#111", flexShrink: 0, fontFamily: "var(--font-manrope), sans-serif" }}>
                        {Math.round(a.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>}

          {/* Disclaimer */}
          <p style={{ color: "#aaa", fontSize: 11, lineHeight: 1.6 }}>
            Scores gerados por modelo quantitativo a partir de indicadores técnicos. Conteúdo informativo — não constitui recomendação de investimento.
          </p>

        </div>
      )}
    </div>
  )
}
