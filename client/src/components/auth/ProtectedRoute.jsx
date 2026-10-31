import * as React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Loader2 } from "lucide-react"

/**
 * ProtectedRoute
 * Protects routes from unauthenticated access.
 * If user is not authenticated, redirects to /login and saves current location in state.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="size-8 animate-spin text-[#2563eb]" />
        <span className="mt-3 text-xs text-neutral-500">Checking authentication…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
