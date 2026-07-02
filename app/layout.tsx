import Header from "./component/Header"
import type { Metadata } from "next"
import { Manrope, Inter } from "next/font/google"
import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Zionix",
  description: "Inteligência que gera valor",
  icons: {
    icon: "/logo-zionix.png",
    apple: "/logo-zionix.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={`${manrope.variable} ${inter.variable}`} style={{ background: "#F4F2EC", margin: 0, padding: 0 }}>
        <Header />
        {children}
      </body>
    </html>
  )
}
