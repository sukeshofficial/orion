import * as React from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { normalizeRole } from "@/lib/roles"
import { Loader2 } from "lucide-react"

/**
 * ProtectedRoute
 *
 * Enforces authentication and role-based access control (RBAC).
 *
 * Behaviors:
 * 1. Authentication loading -> Displays accessible spinner until session is verified.
 * 2. Unauthenticated -> Redirects to /login preserving target location in state.
 * 3. Unknown or missing role -> Denies access safely to /unauthorized.
 * 4. Role mismatch -> Redirects to /unauthorized.
 * 5. Role authorized -> Renders nested children or <Outlet />.
 *
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Optional list of authorized roles (e.g. ['admin'], ['internal_user'])
 * @param {React.ReactNode} [props.children] - Optional child elements (defaults to <Outlet />)
 */
export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, loading, normalizedRole, user } = useAuth()
  const location = useLocation()

  // 1. Session restoration & loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="size-8 animate-spin text-[#2563eb]" />
        <span className="mt-3 text-xs text-neutral-500">Checking authentication…</span>
      </div>
    )
  }

  // 2. Unauthenticated access redirect
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Unknown or missing roles are safely denied
  if (!normalizedRole) {
    return <Navigate to="/unauthorized" replace />
  }

  // 4. Role-based authorization check
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles
      .map((role) => normalizeRole(role))
      .filter(Boolean)

    if (!normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // 5. Authorized access granted
  return children ? children : <Outlet />
}

export default ProtectedRoute
