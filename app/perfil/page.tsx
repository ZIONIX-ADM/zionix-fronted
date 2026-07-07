"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../../lib/supabase"
import type { User } from "@supabase/supabase-js"

export default function Perfil() {
  const router = useRouter()
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [favoritos, setFavoritos] = useState<string[]>([])

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>
    try { supabase = createClient() } catch { router.replace("/"); return }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/")
      } else {
        setUser(data.user)
        import("../../lib/favoritos").then(m => m.getFavoritos()).then(setFavoritos)
      }
    })
  }, [])

  if (user === undefined) {
    return <div style={{ padding: 64, color: "#888" }}>Carregando...</div>
  }
  if (!user) return null

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const nome = (user.user_metadata?.full_name ?? user.email ?? "") as string
  const iniciais = nome.trim().split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase() || "?"

  async function signOut() {
    try { await createClient().auth.signOut() } catch {}
    router.push("/")
  }

  const C = "#C9A84C"

  return (
    <div style={{ minHeight: "100vh", background: "#F4F2EC", padding: "64px 32px", fontFamily: "var(--font-inter), sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Avatar + dados */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,.06)", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={nome} width={72} height={72}
                style={{ borderRadius: "50%", border: `2px solid ${C}44` }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `${C}22`, border: `2px solid ${C}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C, fontSize: 24, fontWeight: 700,
              }}>
                {iniciais}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#111" }}>{nome}</h1>
              <p style={{ fontSize: 14, color: "#888", margin: "4px 0 0" }}>{user.email}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            style={{
              marginTop: 24, background: "#fdecea", color: "#a12d2d",
              border: "1px solid #f5c6c6", borderRadius: 10,
              padding: "9px 20px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Sair da conta
          </button>
        </div>

        {/* Watchlist */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111" }}>
            Ativos favoritos
          </h2>
          {favoritos.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 14 }}>Nenhum ativo salvo ainda.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {favoritos.map((ticker) => (
                <span key={ticker} style={{
                  background: `${C}15`, color: C,
                  border: `1px solid ${C}44`, borderRadius: 8,
                  padding: "6px 14px", fontSize: 13, fontWeight: 600,
                }}>
                  {ticker.replace(/\.SA$/i, "")}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
