import * as React from "react"
import { Home } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ModeToggle } from "@/components/theme/mode-toggle"

/**
 * AuthHeader
 * Top navigation bar inside authentication pages.
 * Contains:
 * - Home button linking to dashboard or home route
 * - Theme toggle supporting light and dark mode with persistence
 */
export function AuthHeader({ className = "" }) {
  const navigate = useNavigate()

  return (
    <header className={`flex items-center justify-end gap-2 p-4 sm:p-6 w-full ${className}`}>
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-border bg-card/60 hover:bg-card text-foreground transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        aria-label="Go to home"
      >
        <Home className="size-4 shrink-0 opacity-80" />
        <span>Home</span>
      </button>
      <ModeToggle
        variant="outline"
        size="sm"
        className="size-8 rounded-lg border-border bg-card/60 hover:bg-card text-foreground transition-all duration-150 shadow-xs cursor-pointer"
      />
    </header>
  )
}

export default AuthHeader
