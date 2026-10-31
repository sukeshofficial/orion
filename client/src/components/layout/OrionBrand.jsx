import * as React from "react"
import { Link } from "react-router-dom"
import { useTheme } from "@/components/theme/theme-provider"
import lightLogo from "@/assets/brand/Blue Orbital Connection Application Icon.png"
import darkLogo from "@/assets/brand/Neon Orbit Nodes Application Icon.png"

/**
 * ORION Brand Component
 * 
 * Uses exact brand logos:
 * - Light surface: Blue Orbital Connection Application Icon
 * - Dark surface (or Dark Theme): Neon Orbit Nodes Application Icon
 * 
 * Props:
 * - collapsed {boolean} Icon-only mode for compact sidebar
 * - surface   {"dark" | "light" | "auto"} Override surface mode (e.g. dark sidebar)
 * - className {string}
 */
export default function OrionBrand({
  collapsed = false,
  surface = "auto",
  className = "",
  to = "/dashboard"
}) {
  const { theme } = useTheme()

  // Determine logo source based on surface & theme
  const isDarkSurface =
    surface === "dark" || (surface === "auto" && theme === "dark")
  const logoSrc = isDarkSurface ? darkLogo : lightLogo

  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 transition-opacity duration-150 hover:opacity-90 select-none ${className}`}
      aria-label="ORION Home"
    >
      <div className="relative flex items-center justify-center shrink-0 size-8 sm:size-9 rounded-xl bg-transparent transition-transform duration-200 group-hover:scale-105">
        <img
          src={logoSrc}
          alt="ORION"
          className="size-8 sm:size-9 object-contain drop-shadow-[0_2px_8px_rgba(102,140,255,0.25)]"
        />
      </div>

      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-semibold tracking-[0.14em] text-base leading-none ${
              isDarkSurface ? "text-white" : "text-[#0B1020] dark:text-[#F5F7FF]"
            }`}
          >
            ORION
          </span>
          <span
            className={`text-[9px] tracking-[0.2em] uppercase font-medium mt-1 leading-none ${
              isDarkSurface
                ? "text-[#A9C4FF]/70"
                : "text-muted-foreground dark:text-[#A9C4FF]/70"
            }`}
          >
            SaaS Platform
          </span>
        </div>
      )}
    </Link>
  )
}

