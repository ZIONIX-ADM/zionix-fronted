"use client"

import { createClient } from "./supabase"

const LS_KEY = "watchlist"

function lsGet(): string[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(LS_KEY) || "[]")
}

function lsSet(tickers: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(tickers))
}

export async function getFavoritos(): Promise<string[]> {
  try {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return lsGet()
    const { data } = await sb.from("favoritos").select("ticker").eq("user_id", user.id)
    return data?.map(r => r.ticker) ?? []
  } catch {
    return lsGet()
  }
}

export async function addFavorito(ticker: string): Promise<void> {
  try {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { lsSet([...new Set([...lsGet(), ticker])]); return }
    await sb.from("favoritos").upsert({ user_id: user.id, ticker }, { onConflict: "user_id,ticker" })
  } catch {
    lsSet([...new Set([...lsGet(), ticker])])
  }
}

export async function removeFavorito(ticker: string): Promise<void> {
  try {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { lsSet(lsGet().filter(t => t !== ticker)); return }
    await sb.from("favoritos").delete().eq("user_id", user.id).eq("ticker", ticker)
  } catch {
    lsSet(lsGet().filter(t => t !== ticker))
  }
}

export async function toggleFavorito(ticker: string, current: string[]): Promise<string[]> {
  if (current.includes(ticker)) {
    await removeFavorito(ticker)
    return current.filter(t => t !== ticker)
  } else {
    await addFavorito(ticker)
    return [...current, ticker]
  }
}
