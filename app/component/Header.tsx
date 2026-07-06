"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type IndiceItem = { valor: number; variacao_pct: number | null; variacao_abs: number | null } | null

type Indices = {
  ibov:  IndiceItem
  dolar: IndiceItem
  sp500: IndiceItem
  btc:   IndiceItem
  selic: IndiceItem
}

function fmt(valor: number, tipo: string): string {
  if (tipo === "ibov")  return Math.round(valor).toLocaleString("pt-BR")
  if (tipo === "dolar") return valor.toFixed(2).replace(".", ",")
  if (tipo === "sp500") return Math.round(valor).toLocaleString("pt-BR")
  if (tipo === "btc")   return Math.round(valor).toLocaleString("pt-BR")
  if (tipo === "selic") return valor.toFixed(2).replace(".", ",") + "%"
  return String(valor)
}

function fmtPct(pct: number): string {
  const sinal = pct >= 0 ? "+" : ""
  return `${sinal}${pct.toFixed(2).replace(".", ",")}%`
}

const PREFIXOS: Record<string, string> = { dolar: "R$ ", btc: "U$ " }

export default function Header() {
  const pathname = usePathname()
  const [indices, setIndices] = useState<Indices | null>(null)

  useEffect(() => {
    async function fetchIndices() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mercado/indices`)
        if (res.ok) setIndices(await res.json())
      } catch {}
    }
    fetchIndices()
    const id = setInterval(fetchIndices, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const items = [
    { key: "ibov",  label: "IBOV" },
    { key: "dolar", label: "DÓLAR" },
    { key: "sp500", label: "S&P 500" },
    { key: "btc",   label: "BTC" },
    { key: "selic", label: "SELIC" },
  ] as const

  return (
    <div style={{ background: "#0a0a0a" }}>

      {/* ── TICKER STRIP ── */}
      <div
        className="w-full flex items-center justify-center gap-0 overflow-hidden"
        style={{
          height: 38,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          fontFamily: "var(--font-inter), Inter, sans-serif",
        }}
      >
        <div className="flex items-center">
          {items.map(({ key, label }, i) => {
            const dado = indices?.[key] ?? null
            const valor = dado ? `${PREFIXOS[key] ?? ""}${fmt(dado.valor, key)}` : "—"
            const pct   = dado?.variacao_pct
            const up    = pct == null ? null : pct >= 0
            return (
              <div key={key} className="flex items-center gap-2 px-5" style={{ borderRight: i < items.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
                <span className="text-[11px] font-medium" style={{ color: "#8a8a8a" }}>{label}</span>
                <span className="text-[11px] font-semibold" style={{ color: "#e8e8e8" }}>{valor}</span>
                {key === "selic" ? (
                  <span className="text-[10px]" style={{ color: "#6b6b6b" }}>a.a.</span>
                ) : up !== null ? (
                  <span className="text-[10px] font-medium" style={{ color: up ? "#3fb378" : "#e0655a" }}>{fmtPct(pct!)}</span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── HEADER ── */}
      <header
        className="w-full flex items-center justify-between"
        style={{
          height: 78,
          maxWidth: 1160,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: "#0a0a0a",
            border: "1px solid rgba(201,168,76,.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg viewBox="0 0 48 48" fill="none" style={{ width: 32, height: 32 }}>
              <circle cx="13" cy="18" r="6.5" fill="#C9A84C" opacity=".16"/>
              <path d="M13 18 L24 32" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
              <path d="M24 32 L28.5 27 L31.5 29 L35 15" stroke="#C9A84C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="13" cy="18" r="2.7" fill="#C9A84C"/>
              <circle cx="35" cy="15" r="3" fill="#C9A84C"/>
            </svg>
          </div>
          <div>
            <p style={{ color: "#ffffff", fontFamily: "var(--font-manrope), Manrope, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.14em", lineHeight: 1 }}>
              ZIONIX
            </p>
            <p style={{ color: "#C9A84C", fontSize: 9.5, letterSpacing: "0.28em", fontWeight: 500, marginTop: 2 }}>
              INTELIGÊNCIA QUE GERA VALOR
            </p>
          </div>
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-8">
          {[
            { href: "/", label: "Mercado" },
            { href: "/watchlist", label: "Carteira" },
            { href: "/analises", label: "Análises" },
          ].map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  color: active ? "#ffffff" : "#7c7c7c",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                  transition: "color .15s",
                }}
              >
                {label}
              </Link>
            )
          })}

          {/* Avatar */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#C9A84C22",
              border: "1px solid #C9A84C55",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C9A84C",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            MZ
          </div>
        </nav>
      </header>
    </div>
  )
}
