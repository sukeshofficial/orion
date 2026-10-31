// src/pages/plans/PlanDetailPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  fetchPlanById,
  updatePlanStatus,
} from "@/redux/Slices/planSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ChevronLeft,
  Pencil,
  Power,
  Boxes,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Package,
} from "lucide-react"

export default function PlanDetailPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedPlan, detailLoading, error } = useSelector((state) => state.plan)

  React.useEffect(() => {
    if (id) {
      dispatch(fetchPlanById(id))
    }
  }, [dispatch, id])

  function handleToggleStatus() {
    if (!selectedPlan) return
    const planId = selectedPlan.id || selectedPlan._id
    dispatch(updatePlanStatus({ id: planId, isActive: !selectedPlan.isActive }))
  }

  if (detailLoading || !selectedPlan) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs text-muted-foreground">Loading subscription plan details...</p>
      </div>
    )
  }

  const p = selectedPlan
  const now = new Date()
  let isAvailable = p.isActive
  if (p.availableFrom && new Date(p.availableFrom) > now) isAvailable = false
  if (p.availableUntil && new Date(p.availableUntil) < now) isAvailable = false

  const associatedProduct =
    p.products && p.products.length > 0 ? p.products[0]?.productId : null

  const productName =
    typeof associatedProduct === "object"
      ? associatedProduct?.name || "Product"
      : "Standard Product"

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumbs & Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Link
              to={`${basePath}/plans`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Plans
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{p.name}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
              {p.name}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                p.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  p.isActive ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {p.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {p.description || "Subscription plan configuration"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleStatus}
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Power className="size-4 text-muted-foreground" />
            {p.isActive ? "Deactivate Plan" : "Activate Plan"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/plans/${id}/edit`)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] transition-colors cursor-pointer"
          >
            <Pencil className="size-4" />
            Edit Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── 2x2 Grid of Detail Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Plan Information */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Boxes className="size-4 text-[#2563EB]" />
            Plan Information
          </h2>

          <div className="divide-y divide-border/60 text-sm">
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Plan Name</span>
              <span className="font-semibold text-foreground">{p.name}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span className="text-foreground max-w-xs text-right">
                {p.description || "—"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium text-foreground">{productName}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-foreground">
                {p.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Availability */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="size-4 text-[#2563EB]" />
            Availability
          </h2>

          <div className="divide-y divide-border/60 text-sm">
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Available From</span>
              <span className="text-foreground">{formatDate(p.availableFrom)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Available Until</span>
              <span className="text-foreground">{formatDate(p.availableUntil)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Availability</span>
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  isAvailable ? "text-emerald-600" : "text-red-500"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    isAvailable ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pricing Configuration */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Package className="size-4 text-[#2563EB]" />
            Pricing Configuration
          </h2>

          <div className="divide-y divide-border/60 text-sm">
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Plan Price</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(p.price)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Billing Interval</span>
              <span className="font-semibold text-foreground capitalize">
                {p.billingInterval}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-muted-foreground">Minimum Quantity</span>
              <span className="font-medium text-foreground">
                {p.minimumQuantity || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Subscription Capabilities */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#2563EB]" />
            Subscription Capabilities
          </h2>

          <div className="divide-y divide-border/60 text-sm">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Auto-close at expiry</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  p.autoCloseAtExpiry
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p.autoCloseAtExpiry ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Allow early closure</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  p.allowEarlyClosure !== false
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p.allowEarlyClosure !== false ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Allow pause</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  p.allowPause !== false
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p.allowPause !== false ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Allow renewal</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  p.allowRenewal !== false
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p.allowRenewal !== false ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

