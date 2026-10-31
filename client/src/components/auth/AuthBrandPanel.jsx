import * as React from "react"
import { useTheme } from "@/components/theme/theme-provider"
import darkExterior from "@/assets/login-dark.png"
import lightExterior from "@/assets/login-light.png"
import darkInterior from "@/assets/register-dark.png"
import lightInterior from "@/assets/register-light.png"

/**
 * HouseIcon
 * Custom SVG matching the exact outline house with doorway mark from the reference.
 */
export function HouseIcon({ className = "size-7" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* House outline */}
      <path d="M4 14.5L16 4.5L28 14.5V26.5C28 27.6 27.1 28.5 26 28.5H6C4.9 28.5 4 27.6 4 26.5V14.5Z" />
      {/* Interior doorway notch */}
      <path d="M13 28.5V19C13 17.9 13.9 17 15 17H17C18.1 17 19 17.9 19 19V28.5" />
    </svg>
  )
}

/**
 * AuthBrandPanel
 * Left panel with edge-to-edge residential property photography, branding,
 * headline with blue highlight, and description text.
 * Adapts image based on pageVariant ("exterior" | "interior") and active theme ("light" | "dark").
 */
export function AuthBrandPanel({
  pageVariant = "exterior", // "exterior" for login, "interior" for register
  className = "",
}) {
  const { theme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  // Choose appropriate photographic asset
  let imageSrc = darkExterior
  if (pageVariant === "interior") {
    imageSrc = isDark ? darkInterior : lightInterior
  } else {
    imageSrc = isDark ? darkExterior : lightExterior
  }

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl md:rounded-3xl p-6 sm:p-10 lg:p-12 select-none min-h-[380px] lg:min-h-full ${className}`}
    >
      {/* Background photographic image */}
      <img
        src={imageSrc}
        alt="Modern residential rental property"
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
        loading="eager"
      />

      {/* Atmospheric theme overlay */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${isDark
          ? "bg-gradient-to-t from-black/80 via-black/35 to-black/60"
          : "bg-gradient-to-t from-white/75 via-white/35 to-white/10"
          }`}
        aria-hidden="true"
      />

      {/* Top brand header */}

      <div className="relative z-10 flex items-center gap-2.5 scale-80 -left-16 -top-5">
        {/* Compact brand icon */}
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-[8px] ${isDark
            ? "bg-white/10 text-white ring-1 ring-white/10"
            : "bg-black/20 text-black-600"
            }`}
        >
          <HouseIcon className="size-5" />
        </div>

        {/* Brand name */}
        <div className="flex flex-col">
          <span
            className={`text-[15px] font-bold leading-5 tracking-tight ${isDark ? "text-white" : "text-neutral-900"
              }`}
          >
            ORION
          </span>

          <span
            className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${isDark ? "text-neutral-400" : "text-neutral-500"
              }`}
          >
            SUBSCRIPTION MANAGEMENT
          </span>
        </div>
      </div>


      {/* Hero statement and supporting copy */}
      <div className="relative z-10 mt-auto pt-16 sm:pt-24 max-w-md scale-80 -left-16 -bottom-10">
        <h1
          className={`text-2xl sm:text-3xl lg:text-4xl !font-display font-extrabold tracking-tight leading-[1.15] ${isDark ? "text-white" : "text-neutral-900"
            }`}
        >
          A better way to manage your{" "}
          <span className="text-[#2563eb] dark:text-[#3b82f6]">subscriptions.</span>
        </h1>
        <p
          className={`mt-3 font-interface text-xs sm:text-sm lg:text-base leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-700"
            }`}
        >
          One platform to manage plans, track subscriptions, and automate recurring billing - all in one place.
        </p>

        {/* Minimal accent bar */}
        {/* <div
          className={`mt-5 sm:mt-6 h-1 w-10 sm:w-12 rounded-full ${
            isDark ? "bg-white/60" : "bg-neutral-800/60"
          }`}
        /> */}
      </div>
    </div>
  )
}

export default AuthBrandPanel
