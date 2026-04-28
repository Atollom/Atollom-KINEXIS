"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — render only after mount
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-all duration-300 z-50 flex items-center justify-center group"
      aria-label="Cambiar tema"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-500 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  )
}
