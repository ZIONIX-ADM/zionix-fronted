"use client"

import AIInterpretation from "./component/AIInterpretation"
import InfoTooltip from "./component/Tooltip"
import { TOOLTIPS } from "./component/tooltips"
import { calcularScoreDiagnostico, gerarCenario, gerarRecomendacao } from "./core/score"
import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from "recharts"

const SINAL_STYLE = (sinal: string) =>
  sinal.toLowerCase().includes("compra") || sinal.toLowerCase().includes("comprar")
    ? { bg: "#e8f5ee", color: "#1a7a45", border: "#b8dfc9" }
    : sinal.toLowerCase().includes("cautela") || sinal.toLowerCase().includes("evitar")
    ? { bg: "#fff3cd", color: "#8a5c00", border: "#f0d58c" }
    : { bg: "#f0f0f0", color: "#555", border: "#ddd" }

const FILTROS_SINAL = ["Todas", "Compra forte", "Compra", "Neutro", "Venda"]

export default function Home() {
  const [ticker, setTicker] = useState("")
  const [resultado, setResultado] = useState<any>(null)
  const [mostrarGrafico, setMostrarGrafico] = useState(false)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [leituraIA, setLeituraIA] = useState<string>("")
  const [leituraLoading, setLeituraLoading] = useState(false)
  const [filtroSinal, setFiltroSinal] = useState("Todas")

  const variacao = resultado?.variacao_percentual ?? 0
  const setor = resultado?.setor ?? ""

  const diagnostico = resultado
    ? calcularScoreDiagnostico({
        precos: resultado.grafico?.precos ?? [],
        highs: resultado.grafico?.highs ?? [],
        lows: resultado.grafico?.lows ?? [],
        datas: resultado.grafico?.datas ?? [],
        mercado: resultado.mercado ?? "neutro",
        setor,
      })
    : { score: 0, decisao: "aguardar" }

  const score = diagnostico.score
  const sinal = gerarRecomendacao(score)
  const cenario = gerarCenario(variacao)

  const dadosGrafico =
    resultado?.grafico?.datas?.map((data: string, i: number) => ({
      data,
      preco: resultado?.grafico?.precos?.[i],
    })) || []

  const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  async function buscar() {
    if (!ticker) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buscar/${ticker}`)
      if (!res.ok) throw new Error(`Erro: ${res.status}`)
      const data = await res.json()
      setResultado(data)
      setMostrarGrafico(false)
      setLeituraIA("")
    } catch (err) {
      console.error("Erro ao buscar ativo:", err)
    }
  }

  useEffect(() => {
    if (!resultado || resultado.nao_elegivel) return
    const diag = calcularScoreDiagnostico({
      precos: resultado.grafico?.precos ?? [],
      highs: resultado.grafico?.highs ?? [],
      lows: resultado.grafico?.lows ?? [],
      datas: resultado.grafico?.datas ?? [],
      mercado: resultado.mercado ?? "neutro",
      setor: resultado.setor ?? "",
    })
    const fallback = resultado.interpretacao_grafico || "Análise técnica processada pelo motor Zionix."
    setLeituraLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analise-ia/${resultado.ticker}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: diag.score,
        decisao: diag.decisao,
        sinal: gerarRecomendacao(diag.score),
        mercado: resultado.mercado ?? "neutro",
        setor: resultado.setor ?? "",
        nome: resultado.nome ?? resultado.ticker,
      }),
    })
      .then(r => r.json())
      .then(d => setLeituraIA(d.texto || fallback))
      .catch(() => setLeituraIA(fallback))
      .finally(() => setLeituraLoading(false))
  }, [resultado])

  useEffect(() => {
    const saved = localStorage.getItem("watchlist")
    if (saved) setWatchlist(JSON.parse(saved))
  }, [])

  useEffect(() => {
    async function carregarRanking() {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => {})
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranking?limite=20`)
        const data = await res.json()
        setRanking(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Erro ao carregar ranking:", err)
      }
    }
    carregarRanking()
  }, [])

  function toggleWatchlist(t: string) {
    const saved = JSON.parse(localStorage.getItem("watchlist") || "[]")
    const updated = saved.includes(t) ? saved.filter((x: string) => x !== t) : [...saved, t]
    localStorage.setItem("watchlist", JSON.stringify(updated))
    setWatchlist(updated)
  }

  const mercadoBadge =
    resultado?.mercado === "bull"
      ? { label: "Mercado em Alta", bg: "#e8f5ee", color: "#1a7a45" }
      : resultado?.mercado === "bear"
      ? { label: "Mercado em Baixa", bg: "#fdecea", color: "#a12d2d" }
      : { label: "Mercado Neutro", bg: "#f0f0f0", color: "#555" }

  const rankingFiltrado =
    filtroSinal === "Todas"
      ? ranking
      : ranking.filter(a => (a.sinal ?? "").toLowerCase().includes(filtroSinal.toLowerCase()))

  const C = "#C9A84C"
  const DARK = "#0a0a0a"
  const BODY = "#F4F2EC"
  const MW = { maxWidth: 1160, margin: "0 auto", padding: "0 32px" }

  return (
    <div style={{ minHeight: "100vh", background: BODY, fontFamily: "var(--font-inter), Inter, sans-serif" }}>

      {/* ═══════════════ HERO (sem resultado) ═══════════════ */}
      {!resultado && (
        <section
          style={{
            background: DARK,
            position: "relative",
            overflow: "hidden",
            paddingBottom: 72,
          }}
        >
          {/* Glow dourado */}
          <div style={{
            position: "absolute", top: "30%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600, height: 300,
            background: "radial-gradient(ellipse at center, rgba(201,168,76,.13) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ ...MW, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 72, position: "relative" }}>

            {/* Pill badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: `1px solid ${C}`, borderRadius: 999,
              padding: "6px 16px", marginBottom: 32,
            }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: C, display: "inline-block" }} />
              <span style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em" }}>
                394 ATIVOS ANALISADOS HOJE
              </span>
            </div>

            {/* H1 */}
            <h1 style={{
              fontFamily: "var(--font-manrope), Manrope, sans-serif",
              fontWeight: 800, fontSize: "clamp(2rem, 5vw, 66px)",
              color: "#ffffff", textAlign: "center", lineHeight: 1.08,
              maxWidth: 700, marginBottom: 20,
            }}>
              Descubra as melhores<br />ações da B3
            </h1>

            <p style={{ color: "#8a8a8a", fontSize: 16, textAlign: "center", maxWidth: 480, marginBottom: 40, lineHeight: 1.6 }}>
              Motor de análise técnica com 394 ativos ranqueados por score diário.
            </p>

            {/* Barra de busca */}
            <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 540, marginBottom: 24 }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                background: "#141414", border: "1px solid #2a2a2a",
                borderRadius: 14, padding: "0 16px",
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                  <circle cx="9" cy="9" r="6" stroke="#555" strokeWidth="1.8" />
                  <path d="M14 14l3 3" stroke="#555" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && buscar()}
                  placeholder="Digite o ticker (ex: PETR4)"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "#fff", fontSize: 14, padding: "14px 0",
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                />
              </div>
              <button
                onClick={buscar}
                style={{
                  background: C, color: DARK, border: "none", borderRadius: 14,
                  padding: "0 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-inter), sans-serif", whiteSpace: "nowrap",
                }}
              >
                Analisar
              </button>
            </div>

            {/* Status line */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b6b6b", fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3fb378", display: "inline-block" }} className="pulse-dot" />
              Mercado B3 · dados atualizados às {horaAtual}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ CORPO — RANKING ═══════════════ */}
      {!resultado && (
        <div style={{ ...MW, paddingTop: 56, paddingBottom: 80 }}>

          {/* Header de seção */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ color: C, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", marginBottom: 4 }}>TOP OPORTUNIDADES</p>
              <p style={{ color: "#888", fontSize: 13 }}>Ativos com melhor setup técnico hoje</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Chips de filtro */}
              {FILTROS_SINAL.map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroSinal(f)}
                  style={{
                    padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: "1px solid",
                    background: filtroSinal === f ? DARK : "transparent",
                    color: filtroSinal === f ? "#fff" : "#555",
                    borderColor: filtroSinal === f ? DARK : "#ddd",
                    transition: "all .15s",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {rankingFiltrado.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, color: "#aaa", fontSize: 14, textAlign: "center" }}>
              {ranking.length === 0 ? "Carregando oportunidades..." : "Nenhum ativo nesse filtro."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rankingFiltrado.slice(0, 10).map((ativo, idx) => {
                const s = SINAL_STYLE(ativo.sinal ?? "")
                const tickerLimpo = (ativo.ticker ?? "").replace(".SA", "")
                return (
                  <div
                    key={ativo.ticker}
                    style={{
                      background: "#fff", borderRadius: 16,
                      border: "1px solid #ebebeb",
                      padding: "14px 20px",
                      display: "flex", alignItems: "center", gap: 16,
                      transition: "box-shadow .15s",
                      cursor: "default",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.07)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* Rank */}
                    <span style={{ color: "#ccc", fontSize: 12, fontWeight: 700, minWidth: 24, textAlign: "right" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: DARK, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: C, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em" }}>
                        {tickerLimpo.slice(0, 3)}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{tickerLimpo}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 9px",
                          borderRadius: 999, background: s.bg, color: s.color,
                          border: `1px solid ${s.border}`,
                        }}>{ativo.sinal}</span>
                      </div>
                      {ativo.nome && (
                        <p style={{ fontSize: 12, color: "#999", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ativo.nome}
                        </p>
                      )}
                    </div>

                    {/* Preço */}
                    {ativo.preco != null && (
                      <div style={{ textAlign: "right", minWidth: 64, flexShrink: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                          R$ {Number(ativo.preco).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Score */}
                    <div style={{ minWidth: 80, flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "#111", fontFamily: "var(--font-manrope), sans-serif" }}>
                          {Math.round(ativo.score)}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "#f0f0f0", borderRadius: 99 }}>
                        <div style={{ height: 4, borderRadius: 99, background: C, width: `${Math.min(ativo.score, 100)}%`, transition: "width .4s" }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Disclaimer */}
          <p style={{ color: "#aaa", fontSize: 11, marginTop: 32, lineHeight: 1.6, maxWidth: 680 }}>
            Scores gerados por modelo quantitativo a partir de indicadores técnicos. Conteúdo informativo — não constitui recomendação de investimento.
          </p>
        </div>
      )}

      {/* ═══════════════ DETALHE DO ATIVO ═══════════════ */}
      {resultado && (
        <div style={{ ...MW, paddingTop: 32, paddingBottom: 80 }}>

          {/* Voltar */}
          <button
            onClick={() => setResultado(null)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#888", fontSize: 13, display: "flex", alignItems: "center", gap: 6,
              marginBottom: 24, padding: 0,
            }}
          >
            ← Voltar ao mercado
          </button>

          {/* Barra de busca (contexto de resultado) */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, maxWidth: 480 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 10,
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 12, padding: "0 14px",
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 20 20">
                <circle cx="9" cy="9" r="6" stroke="#bbb" strokeWidth="1.8" />
                <path d="M14 14l3 3" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && buscar()}
                placeholder="Buscar outro ativo..."
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#333", fontSize: 13, padding: "11px 0",
                }}
              />
            </div>
            <button
              onClick={buscar}
              style={{
                background: C, color: DARK, border: "none", borderRadius: 12,
                padding: "0 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              Analisar
            </button>
          </div>

          {resultado.nao_elegivel ? (
            <div style={{ background: "#fdecea", border: "1px solid #f5c6c6", borderRadius: 16, padding: 24 }}>
              <p style={{ fontWeight: 700, color: "#a12d2d" }}>{resultado.nome || resultado.ticker}</p>
              <p style={{ color: "#c0392b", marginTop: 6, fontSize: 14 }}>Não foi possível analisar: {resultado.motivo}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>

              {/* CARD PRINCIPAL */}
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ebebeb", padding: 28, position: "relative" }}>
                <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => toggleWatchlist(resultado.ticker)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: watchlist.includes(resultado.ticker) ? "#C9A84C" : "#ccc" }}
                  >
                    {watchlist.includes(resultado.ticker) ? "★" : "☆"}
                  </button>
                  <button
                    onClick={() => setMostrarGrafico(!mostrarGrafico)}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", background: "#f5f5f5",
                      border: "none", cursor: "pointer", fontSize: 16, color: "#666",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {mostrarGrafico ? "−" : "+"}
                  </button>
                </div>

                <p style={{ fontSize: 18, fontWeight: 700, color: "#111", fontFamily: "var(--font-manrope), sans-serif" }}>
                  {resultado.nome}
                </p>
                <p style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>{(resultado.ticker ?? "").replace(".SA", "")}</p>

                <p style={{ fontSize: 36, fontWeight: 800, color: "#111", marginTop: 12, fontFamily: "var(--font-manrope), sans-serif", lineHeight: 1 }}>
                  {resultado.preco}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: variacao >= 0 ? "#1a7a45" : "#a12d2d" }}>
                  {variacao >= 0 ? "+" : ""}{variacao}%
                </p>

                {/* Badges */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  {(() => { const s = SINAL_STYLE(sinal); return (
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                      {sinal}
                    </span>
                  )})()}
                  {resultado.mercado && (
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999,
                      background: mercadoBadge.bg, color: mercadoBadge.color,
                      border: "1px solid #ddd",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      {mercadoBadge.label}
                      <InfoTooltip text={TOOLTIPS.regimeMercado} position="bottom" />
                    </span>
                  )}
                </div>

                {/* Score */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#aaa", display: "flex", alignItems: "center", gap: 4 }}>
                      Score <InfoTooltip text={TOOLTIPS.score} />
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#111", fontFamily: "var(--font-manrope), sans-serif" }}>
                      {Math.round(score)}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 99 }}>
                    <div style={{ height: 6, borderRadius: 99, background: C, width: `${Math.min(score, 100)}%`, transition: "width .5s" }} />
                  </div>
                </div>

                {resultado.confiabilidade === "reduzida" && (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb", border: "1px solid #f0d58c", borderRadius: 10, fontSize: 12, color: "#8a5c00" }}>
                    <strong>Confiabilidade reduzida: </strong>
                    {resultado.avisos_confiabilidade?.join(" · ")}
                  </div>
                )}

                {/* Gráfico */}
                {mostrarGrafico && dadosGrafico.length > 0 && (
                  <div style={{ marginTop: 24, height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosGrafico}>
                        <XAxis dataKey="data" tick={{ fontSize: 10, fill: "#aaa" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                        <ChartTooltip />
                        <Line type="monotone" dataKey="preco" stroke={C} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* CENÁRIO */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "18px 22px" }}>
                <p style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>Cenário</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#111", fontFamily: "var(--font-manrope), sans-serif" }}>{cenario}</p>
              </div>

              {/* GRID 2x2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Setor", value: resultado.setor },
                  { label: "Moeda", value: resultado.moeda },
                  { label: "Exposição", value: resultado.exposicao },
                  { label: "Riscos", value: resultado.riscos },
                ].map(item => (
                  <div key={item.label} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "16px 18px" }}>
                    <p style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 13, color: "#333" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* LEITURA DA IA */}
              <AIInterpretation
                texto={leituraIA || resultado.interpretacao_grafico || ""}
                loading={leituraLoading}
              />

              {/* Disclaimer */}
              <p style={{ color: "#bbb", fontSize: 11, lineHeight: 1.6 }}>
                Scores gerados por modelo quantitativo a partir de indicadores técnicos. Conteúdo informativo — não constitui recomendação de investimento.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
