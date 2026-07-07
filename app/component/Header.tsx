"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createClient } from "../../lib/supabase"
import type { User } from "@supabase/supabase-js"

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
  const router = useRouter()
  const [indices, setIndices] = useState<Indices | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    let sb: ReturnType<typeof createClient>
    try { sb = createClient() } catch { setLoading(false); return }

    sb.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function signIn() {
    try {
      const sb = createClient()
      await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
    } catch {}
  }

  async function signOut() {
    try {
      const sb = createClient()
      await sb.auth.signOut()
    } catch {}
    setDropdownOpen(false)
    router.push("/")
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const nome = (user?.user_metadata?.full_name ?? user?.email ?? "") as string
  const iniciais = nome.trim().split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase() || "?"

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

          {/* Auth */}
          {loading ? (
            <div style={{ width: 34, height: 34 }} />
          ) : !user ? (
            <button
              onClick={signIn}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#ffffff", color: "#111", border: "none",
                borderRadius: 10, padding: "7px 14px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 5.1C9.6 39.5 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.5 5.8l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              Entrar
            </button>
          ) : (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nome} width={34} height={34}
                    style={{ borderRadius: "50%", border: "2px solid #C9A84C55", display: "block" }} />
                ) : (
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "#C9A84C22", border: "1px solid #C9A84C55",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#C9A84C", fontSize: 12, fontWeight: 700,
                  }}>
                    {iniciais}
                  </div>
                )}
              </button>
              {dropdownOpen && (
                <div style={{
                  position: "absolute", right: 0, top: 42, zIndex: 100,
                  background: "#1a1a1a", border: "1px solid #2a2a2a",
                  borderRadius: 12, padding: "6px 0", minWidth: 160,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                }}>
                  <div style={{ padding: "8px 16px 8px", borderBottom: "1px solid #2a2a2a", marginBottom: 4 }}>
                    <p style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600, margin: 0 }}>{nome.split(" ")[0]}</p>
                    <p style={{ color: "#666", fontSize: 11, margin: 0, marginTop: 2 }}>{user.email}</p>
                  </div>
                  <Link href="/perfil" onClick={() => setDropdownOpen(false)}
                    style={{ display: "block", padding: "8px 16px", color: "#ccc", fontSize: 13, textDecoration: "none" }}>
                    Meu Perfil
                  </Link>
                  <button onClick={signOut} style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 16px", color: "#e0655a", fontSize: 13,
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-inter), sans-serif",
                  }}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>
    </div>
  )
}
