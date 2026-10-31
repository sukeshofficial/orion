import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import { ShieldAlert, ArrowRight, LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getDefaultDashboard } from "@/lib/roles"
import OrionBrand from "@/components/layout/OrionBrand"

export default function UnauthorizedPage() {
  const { user, normalizedRole, logoutUser } = useAuth()
  const navigate = useNavigate()

  const userDashboard = getDefaultDashboard(normalizedRole)

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate("/login", { replace: true })
    } catch {
      navigate("/login", { replace: true })
    }
  }

  // Friendly label for user role
  const roleLabel =
    normalizedRole === "admin"
      ? "Administrator"
      : normalizedRole === "internal_user"
      ? "Internal Staff"
      : normalizedRole === "user"
      ? "Customer"
      : user?.role || "Unknown Role"

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-[#0B1020] text-foreground flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <OrionBrand surface="auto" />
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl text-center space-y-6">
          {/* Warning Icon Badge */}
          <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
            <ShieldAlert className="size-8" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400">
              403 • Access Restricted
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Permission Required
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              You do not have the required permissions to view this section of the ORION workspace.
            </p>
          </div>

          {/* User Account Context Banner */}
          {user && (
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs text-left space-y-1">
              <div className="text-neutral-500 dark:text-neutral-400">
                Currently signed in as:
              </div>
              <div className="font-semibold text-foreground truncate">
                {user.name || user.email}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Assigned Role: <span className="font-medium text-foreground">{roleLabel}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {normalizedRole ? (
              <Link
                to={userDashboard}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 px-4 text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <LayoutDashboard className="size-4" />
                <span>Return to My Dashboard</span>
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 px-4 text-sm transition-all shadow-sm cursor-pointer"
              >
                <span>Sign In to Continue</span>
                <ArrowRight className="size-4" />
              </Link>
            )}

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-medium py-2.5 px-4 text-xs transition-colors cursor-pointer"
              >
                <LogOut className="size-3.5 text-neutral-500" />
                <span>Sign in with a different account</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center py-4 text-xs text-neutral-400">
        ORION — Subscriptions • Billing • Growth
      </footer>
    </div>
  )
}

