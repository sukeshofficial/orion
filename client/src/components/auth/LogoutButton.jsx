import * as React from "react"
import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

/**
 * LogoutButton
 * Accessible, styled logout button that triggers backend logout logic via AuthContext
 * (which invokes authService.logout() with bearer headers and clears stored credentials).
 */
export function LogoutButton({ className = "", variant = "default" }) {
  const { logoutUser } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await logoutUser()
    } finally {
      setLoggingOut(false)
    }
  }

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer"

  const variantStyles =
    variant === "outline"
      ? "border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 px-3.5 py-2"
      : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs px-4 py-2.5"

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      aria-label="Sign out of account"
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {loggingOut ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>Signing out…</span>
        </>
      ) : (
        <>
          <LogOut className="size-4 shrink-0 opacity-90" />
          <span>Sign out</span>
        </>
      )}
    </button>
  )
}

export default LogoutButton
