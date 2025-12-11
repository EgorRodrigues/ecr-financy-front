"use client"

import { useEffect, useRef } from "react"

export function FormConfig({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    try {
      const t = localStorage.getItem("financy_theme")
      const html = document.documentElement
      if (t === "dark") html.classList.add("dark")
      else html.classList.remove("dark")
      const cols = Number(localStorage.getItem("financy_form_cols"))
      const compact = localStorage.getItem("financy_form_compact") === "true"
      const el = ref.current
      if (el) {
        el.setAttribute("data-form-cols", String(cols === 3 ? 3 : 2))
        el.setAttribute("data-form-compact", compact ? "true" : "false")
      }
    } catch {}
  }, [])

  return (
    <div className={className} ref={ref} suppressHydrationWarning data-form-cols="2" data-form-compact="false">
      {children}
    </div>
  )
}
