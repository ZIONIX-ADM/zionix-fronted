import Header from "./component/Header"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Zionix",
  description: "Inteligência que gera valor",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#f5f5f7]`}>

        {/* HEADER GLOBAL */}
        <Header />

        {/* CONTEÚDO */}
        <main className="px-8 pt-6">
          {children}
        </main>

      </body>
    </html>
  )
}