"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TICKER_STRIP = [
  { label: "IBOV", value: "136.240", var: "+0,84%", up: true },
  { label: "DÓLAR", value: "5,74", var: "-0,12%", up: false },
  { label: "S&P 500", value: "5.953", var: "+0,31%", up: true },
  { label: "BTC", value: "107.320", var: "+1,20%", up: true },
  { label: "SELIC", value: "13,75%", var: "a.a.", up: null },
]

export default function Header() {
  const pathname = usePathname()

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
          {TICKER_STRIP.map((t, i) => (
            <div key={t.label} className="flex items-center gap-2 px-5" style={{ borderRight: i < TICKER_STRIP.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
              <span className="text-[11px] font-medium" style={{ color: "#8a8a8a" }}>{t.label}</span>
              <span className="text-[11px] font-semibold" style={{ color: "#e8e8e8" }}>{t.value}</span>
              {t.up !== null ? (
                <span className="text-[10px] font-medium" style={{ color: t.up ? "#3fb378" : "#e0655a" }}>{t.var}</span>
              ) : (
                <span className="text-[10px]" style={{ color: "#6b6b6b" }}>{t.var}</span>
              )}
            </div>
          ))}
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
          <div
            style={{
              width: 36,
              height: 36,
              background: "#C9A84C",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Or mi'Tziyon simplified SVG */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3.5" fill="#0a0a0a" />
              <path d="M10 2 L10 5M10 15 L10 18M2 10 L5 10M15 10 L18 10" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M4.4 4.4 L6.5 6.5M13.5 13.5 L15.6 15.6M15.6 4.4 L13.5 6.5M6.5 13.5 L4.4 15.6" stroke="#0a0a0a" strokeWidth="1.4" strokeLinecap="round" />
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
