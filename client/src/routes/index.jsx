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

// ── Phase 2 — Customer Management Pages ──────────────────────────────────────
import CustomerListPage from "@/pages/customers/CustomerListPage"
import CustomerFormPage from "@/pages/customers/CustomerFormPage"
import CustomerDetailPage from "@/pages/customers/CustomerDetailPage"

// ── Phase 3 — Product & Tax Management Pages ──────────────────────────────────
import ProductListPage from "@/pages/products/ProductListPage"
import ProductFormPage from "@/pages/products/ProductFormPage"
import TaxListPage from "@/pages/taxes/TaxListPage"

// ── Phase 4 — Subscription Plan Management Pages ──────────────────────────────
import PlanListPage from "@/pages/plans/PlanListPage"
import PlanFormPage from "@/pages/plans/PlanFormPage"
import PlanDetailPage from "@/pages/plans/PlanDetailPage"

// ── Phase 5 — Quotation & Template Management Pages ───────────────────────────
import TemplateListPage from "@/pages/quotations/TemplateListPage"
import TemplateFormPage from "@/pages/quotations/TemplateFormPage"
import QuotationListPage from "@/pages/quotations/QuotationListPage"
import QuotationWizardPage from "@/pages/quotations/QuotationWizardPage"
import QuotationDetailPage from "@/pages/quotations/QuotationDetailPage"

// ── Phase 6 ─ Subscription Management Pages ──────────────────────────────────
import SubscriptionListPage from "@/pages/subscriptions/SubscriptionListPage"
import SubscriptionWizardPage from "@/pages/subscriptions/SubscriptionWizardPage"
import SubscriptionDetailPage from "@/pages/subscriptions/SubscriptionDetailPage"

// ── Phase 7 ─ Discount Management Pages ──────────────────────────────────────
import DiscountListPage from "@/pages/discounts/DiscountListPage"
import DiscountFormPage from "@/pages/discounts/DiscountFormPage"
import DiscountDetailPage from "@/pages/discounts/DiscountDetailPage"

// ── Phase 8 ─ Invoice Management Pages ───────────────────────────────────────
import InvoiceListPage from "@/pages/invoices/InvoiceListPage"
import InvoiceDetailPage from "@/pages/invoices/InvoiceDetailPage"

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

        {/* Phase 2 — Customer Management */}
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/new" element={<CustomerFormPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="customers/:id/edit" element={<CustomerFormPage />} />

        {/* Phase 3 — Product & Tax Management */}
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="taxes" element={<TaxListPage />} />

        {/* Phase 4 — Subscription Plan Management */}
        <Route path="plans" element={<PlanListPage />} />
        <Route path="plans/new" element={<PlanFormPage />} />
        <Route path="plans/:id" element={<PlanDetailPage />} />
        <Route path="plans/:id/edit" element={<PlanFormPage />} />

        {/* Phase 5 — Quotation Templates & Quotations */}
        <Route path="quotation-templates" element={<TemplateListPage />} />
        <Route path="quotation-templates/new" element={<TemplateFormPage />} />
        <Route path="quotation-templates/:id/edit" element={<TemplateFormPage />} />
        <Route path="quotations" element={<QuotationListPage />} />
        <Route path="quotations/new" element={<QuotationWizardPage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />
        <Route path="quotations/:id/edit" element={<QuotationWizardPage />} />

        {/* Phase 6 – Subscription Lifecycle Management */}
        <Route path="subscriptions" element={<SubscriptionListPage />} />
        <Route path="subscriptions/new" element={<SubscriptionWizardPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />

        {/* Phase 7 – Discount Management */}
        <Route path="discounts" element={<DiscountListPage />} />
        <Route path="discounts/new" element={<DiscountFormPage />} />
        <Route path="discounts/:id" element={<DiscountDetailPage />} />
        <Route path="discounts/:id/edit" element={<DiscountFormPage />} />

        {/* Phase 8 – Invoice Management */}
        <Route path="invoices" element={<InvoiceListPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />

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

        {/* Phase 2 — Customer Management */}
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/new" element={<CustomerFormPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="customers/:id/edit" element={<CustomerFormPage />} />

        {/* Phase 3 — Products & Taxes (Staff Read/Catalog) */}
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="taxes" element={<TaxListPage />} />

        {/* Phase 4 — Subscription Plans (Staff Read/View) */}
        <Route path="plans" element={<PlanListPage />} />
        <Route path="plans/:id" element={<PlanDetailPage />} />

        {/* Phase 5 — Quotations & Templates (Primary Staff Workflow) */}
        <Route path="quotation-templates" element={<TemplateListPage />} />
        <Route path="quotation-templates/new" element={<TemplateFormPage />} />
        <Route path="quotation-templates/:id/edit" element={<TemplateFormPage />} />
        <Route path="quotations" element={<QuotationListPage />} />
        <Route path="quotations/new" element={<QuotationWizardPage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />
        <Route path="quotations/:id/edit" element={<QuotationWizardPage />} />

        {/* Phase 6 – Subscriptions (Staff Full Access) */}
        <Route path="subscriptions" element={<SubscriptionListPage />} />
        <Route path="subscriptions/new" element={<SubscriptionWizardPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />

        {/* Phase 7 – Discounts (Staff Read + Apply) */}
        <Route path="discounts" element={<DiscountListPage />} />
        <Route path="discounts/new" element={<DiscountFormPage />} />
        <Route path="discounts/:id" element={<DiscountDetailPage />} />
        <Route path="discounts/:id/edit" element={<DiscountFormPage />} />

        {/* Phase 8 – Invoices (Staff Full Access) */}
        <Route path="invoices" element={<InvoiceListPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />

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
