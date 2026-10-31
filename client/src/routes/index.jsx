import * as React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import VerifyEmailPage from "@/pages/VerifyEmailPage"
import UnauthorizedPage from "@/pages/UnauthorizedPage"
import DashboardPage from "@/pages/DashboardPage"
import UserProfilePage from "@/pages/UserProfilePage"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminLayout from "@/components/layout/AdminLayout"
import StaffLayout from "@/components/layout/StaffLayout"
import CustomerLayout from "@/components/layout/CustomerLayout"
import { useAuth } from "@/context/AuthContext"
import { getDefaultDashboard, getRoleProfilePath } from "@/lib/roles"
import { Loader2 } from "lucide-react"

/**
 * DashboardRedirect
 * Redirects authenticated users from legacy /dashboard to their role-specific dashboard
 * preserving query parameters (e.g. ?tab=customers). Unauthenticated users go to /login.
 */
function DashboardRedirect() {
  const { isAuthenticated, loading, normalizedRole } = useAuth()
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

  const target = `${getDefaultDashboard(normalizedRole)}${location.search}`
  return <Navigate to={target} replace />
}

/**
 * ProfileRedirect
 * Redirects authenticated users from legacy /profile to their role-specific profile route.
 * Unauthenticated users go to /login.
 */
function ProfileRedirect() {
  const { isAuthenticated, loading, normalizedRole } = useAuth()
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

  return <Navigate to={getRoleProfilePath(normalizedRole)} replace />
}

/**
 * RootRedirect
 * Resolves root (/) and unknown paths to the authenticated user's role dashboard,
 * or /login for unauthenticated visitors.
 */
function RootRedirect() {
  const { isAuthenticated, loading, normalizedRole } = useAuth()
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

  return <Navigate to={getDefaultDashboard(normalizedRole)} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Authentication & Status Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/register" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* 2. Admin Route Group: /admin/* (Allowed role: admin) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 3. Internal Staff Route Group: /staff/* (Allowed roles: internal_user, internal_staff) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["internal_user", "internal_staff"]}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 4. Customer Portal Route Group: /portal/* (Allowed roles: user, customer, end_user) */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={["user", "customer", "end_user"]}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 5. Fallback & Shortcut Redirects */}
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/profile" element={<ProfileRedirect />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
