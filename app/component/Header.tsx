"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()

  return (
    <header style={{ background: "#0a0a0a" }} className="w-full px-8 py-4 flex items-center justify-between">

      {/* LOGO */}
      <div className="flex items-center gap-3">
        <div
          style={{ background: "#C9A84C", width: 32, height: 32 }}
          className="rounded-md flex items-center justify-center font-bold text-black text-base"
        >
          Z
        </div>
        <div>
          <h1 className="text-white font-semibold tracking-[0.18em] text-sm">ZIONIX</h1>
          <p style={{ color: "#C9A84C" }} className="text-[9px] tracking-[0.2em]">
            INTELIGÊNCIA QUE GERA VALOR
          </p>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex gap-8 text-sm">
        <Link
          href="/"
          className="transition"
          style={{ color: pathname === "/" ? "#ffffff" : "#6b7280" }}
        >
          Mercado
        </Link>
        <Link
          href="/watchlist"
          className="transition"
          style={{ color: pathname === "/watchlist" ? "#ffffff" : "#6b7280" }}
        >
          Carteira
        </Link>
        <Link
          href="/analises"
          style={{ color: "#6b7280" }}
          className="transition hover:text-white"
        >
          Análises
        </Link>
      </nav>

    </header>
  )
}
