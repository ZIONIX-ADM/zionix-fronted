"use client"

import { useState, useRef, useEffect } from "react"

type Props = {
  text: string
  position?: "top" | "bottom"
}

export default function Tooltip({ text, position = "top" }: Props) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // fecha ao tocar fora (mobile)
  useEffect(() => {
    if (!visible) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("touchstart", handleOutside)
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("touchstart", handleOutside)
    }
  }, [visible])

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={e => { e.stopPropagation(); setVisible(v => !v) }}
    >
      {/* ícone ? */}
      <span
        className="inline-flex items-center justify-center rounded-full text-xs font-bold cursor-pointer select-none"
        style={{
          width: 15,
          height: 15,
          background: "#C9A84C22",
          color: "#C9A84C",
          border: "1px solid #C9A84C55",
          fontSize: 10,
          lineHeight: 1,
        }}
        aria-label="informação"
      >
        ?
      </span>

      {/* balão */}
      {visible && (
        <span
          role="tooltip"
          className="absolute z-50 rounded-xl text-xs leading-relaxed shadow-lg pointer-events-none"
          style={{
            background: "#1a1a1a",
            color: "#e5e7eb",
            padding: "8px 12px",
            width: 220,
            left: "50%",
            transform: "translateX(-50%)",
            ...(position === "top"
              ? { bottom: "calc(100% + 8px)" }
              : { top: "calc(100% + 8px)" }),
            border: "1px solid #C9A84C44",
          }}
        >
          {/* seta */}
          <span
            className="absolute"
            style={{
              width: 8,
              height: 8,
              background: "#1a1a1a",
              border: "1px solid #C9A84C44",
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              ...(position === "top"
                ? { bottom: -5, borderTop: "none", borderLeft: "none" }
                : { top: -5, borderBottom: "none", borderRight: "none" }),
            }}
          />
          {text}
        </span>
      )}
    </span>
  )
}
