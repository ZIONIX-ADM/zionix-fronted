"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()

  return (
    <div className="w-full px-8 pt-6">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm px-8 py-4 flex items-center justify-between">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <img src="/logo-zionix.png" alt="Zionix" className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-semibold tracking-wide">ZIONIX</h1>
            <p className="text-[10px] text-gray-400 tracking-widest">
              INTELIGÊNCIA QUE GERA VALOR
            </p>
          </div>
        </div>

        {/* NAV */}
        <div className="flex gap-8 text-sm">
          <Link
            href="/"
            className={
              pathname === "/"
                ? "text-black font-medium border-b-2 border-black pb-1"
                : "text-gray-400 hover:text-black transition"
            }
          >
            Mercado
          </Link>

          <Link
            href="/watchlist"
            className={
              pathname === "/watchlist"
                ? "text-black font-medium border-b-2 border-black pb-1"
                : "text-gray-400 hover:text-black transition"
            }
          >
            Carteira
          </Link>

          <Link
            href="/analises"
            className="text-gray-400 hover:text-black transition"
          >
            Análises
          </Link>
        </div>

      </div>
    </div>
  )
}