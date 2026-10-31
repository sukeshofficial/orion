// src/pages/subscriptions/SubscriptionListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import {
  fetchSubscriptions,
  fetchSubscriptionStats,
  setFilters,
  pauseSubscription,
  resumeSubscription,
  closeSubscription,
} from "@/redux/Slices/subscriptionSlice"
import { fetchPlans } from "@/redux/Slices/planSlice"
import { fetchCustomers } from "@/redux/Slices/customerSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  Boxes,
  Shield,
  PauseCircle,
  XCircle,
  Clock,
  FileCheck,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const colorMap = {
    blue: "bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    red: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
  }
  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-5 flex items-center gap-4">
      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function SubStatusBadge({ status }) {
  const st = (status || "active").toLowerCase()

  if (st === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
        Active
      </span>
    )
  }
  if (st === "paused") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300">
        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
        Paused
      </span>
    )
  }
  if (st === "closed" || st === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-300">
        <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
        Closed
      </span>
    )
  }
  if (st === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300">
        <span className="size-1.5 rounded-full bg-purple-500 shrink-0" />
        Draft
      </span>
    )
  }
  if (st === "expiring soon") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300">
        <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
        Expiring Soon
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
      <span className="size-1.5 rounded-full bg-neutral-500 shrink-0" />
      {status || "Active"}
    </span>
  )
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

function RowActions({ subscription, onView, onPause, onResume, onClose }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const st = (subscription.status || "").toLowerCase()
  const isPaused = st === "paused"
  const isActive = st === "active"
  const canClose = st !== "closed"

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        aria-label="Subscription actions"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-border/80 bg-card p-1 shadow-lg shadow-black/5 animate-in fade-in-50 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onView(subscription)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            View Details
          </button>

          {isActive && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onPause(subscription)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
            >
              <Pause className="size-3.5" />
              Pause Subscription
            </button>
          )}

          {isPaused && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onResume(subscription)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
            >
              <Play className="size-3.5" />
              Resume Subscription
            </button>
          )}

          {canClose && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onClose(subscription)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Ban className="size-3.5" />
              Close Subscription
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main SubscriptionListPage Component ──────────────────────────────────────

export default function SubscriptionListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { subscriptions, pagination, stats, filters, loading, error } = useSelector(
    (state) => state.subscription
  )
  const { plans } = useSelector((state) => state.plan)
  const { customers } = useSelector((state) => state.customer)

  const [searchInput, setSearchInput] = React.useState(filters.search || "")
  const [selectedStatus, setSelectedStatus] = React.useState(filters.status || "")
  const [selectedPlanId, setSelectedPlanId] = React.useState(filters.planId || "")
  const [selectedCustomerId, setSelectedCustomerId] = React.useState(filters.customerId || "")
  const [pageSize, setPageSize] = React.useState(8)

  React.useEffect(() => {
    dispatch(fetchSubscriptionStats())
    dispatch(fetchPlans({ limit: 100, isActive: true }))
    dispatch(fetchCustomers({ limit: 100, status: "active" }))
  }, [dispatch])

  const loadData = React.useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: pageSize,
      }
      if (searchInput.trim()) params.search = searchInput.trim()
      if (selectedStatus) params.status = selectedStatus
      if (selectedPlanId) params.planId = selectedPlanId
      if (selectedCustomerId) params.customerId = selectedCustomerId

      dispatch(fetchSubscriptions(params))
    },
    [dispatch, pageSize, searchInput, selectedStatus, selectedPlanId, selectedCustomerId]
  )

  React.useEffect(() => {
    loadData(1)
  }, [loadData])

  function handleReset() {
    setSearchInput("")
    setSelectedStatus("")
    setSelectedPlanId("")
    setSelectedCustomerId("")
    dispatch(setFilters({ search: "", status: "", planId: "", customerId: "" }))
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      loadData(newPage)
    }
  }

  function handlePause(sub) {
    const id = sub.id || sub._id
    const reason = prompt("Reason for pausing (optional):") || "User request"
    dispatch(pauseSubscription({ id, reason })).then(() => {
      dispatch(fetchSubscriptionStats())
      loadData(pagination.page)
    })
  }

  function handleResume(sub) {
    const id = sub.id || sub._id
    dispatch(resumeSubscription(id)).then(() => {
      dispatch(fetchSubscriptionStats())
      loadData(pagination.page)
    })
  }

  function handleClose(sub) {
    const id = sub.id || sub._id
    const reason = prompt("Reason for closing (optional):") || "Cancelled"
    dispatch(closeSubscription({ id, reason })).then(() => {
      dispatch(fetchSubscriptionStats())
      loadData(pagination.page)
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
            Manage customer subscriptions and their lifecycle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/subscriptions/new`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          Create Subscription
        </button>
      </div>

      {/* ── 6 Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Shield} label="Total Subscriptions" value={stats.total} color="blue" />
        <StatCard icon={Shield} label="Active" value={stats.active} color="emerald" />
        <StatCard icon={PauseCircle} label="Paused" value={stats.paused} color="amber" />
        <StatCard icon={XCircle} label="Closed" value={stats.closed} color="red" />
        <StatCard icon={FileCheck} label="Draft" value={stats.draft} color="purple" />
        <StatCard icon={Clock} label="Expiring Soon" value={stats.expiringSoon} color="orange" />
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadData(1)
              }}
              placeholder="Search subscriptions by number, customer, plan..."
              className="w-full h-10 rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
            </select>

            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[140px]"
            >
              <option value="">All Plans</option>
              {plans.map((pl) => (
                <option key={pl.id || pl._id} value={pl.id || pl._id}>
                  {pl.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[140px]"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name || c.userId?.name || c.companyName || "Customer"}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border/70 bg-background text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Table & Pagination ── */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-b border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
                <th className="px-4 py-3.5 w-12">#</th>
                <th className="px-4 py-3.5">Subscription No.</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Billing Interval</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4" colSpan={10}>
                      <div className="h-4 bg-muted rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <Boxes className="size-8 mx-auto mb-2 opacity-40" />
                    No subscriptions found. Click "Create Subscription" to initiate a subscription from an eligible quotation.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub, idx) => {
                  const id = sub.id || sub._id
                  const customerName =
                    sub.customerId?.name ||
                    sub.customerId?.userId?.name ||
                    sub.customerId?.companyName ||
                    sub.customerName ||
                    "Customer"
                  const planName = sub.planId?.name || sub.planName || "Plan"
                  const interval =
                    (sub.billingInterval || "monthly").charAt(0).toUpperCase() +
                    (sub.billingInterval || "monthly").slice(1)

                  return (
                    <tr
                      key={id || idx}
                      onClick={() => navigate(`${basePath}/subscriptions/${id}`)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                        {(pagination.page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground font-mono text-xs">
                        {sub.subscriptionNumber || `SUB-${String(idx + 1).padStart(4, "0")}`}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">{customerName}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{planName}</td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(sub.startDate)}</td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(sub.expiryDate)}</td>
                      <td className="px-4 py-3.5 text-foreground">{interval}</td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">{formatCurrency(sub.grandTotal ?? sub.totalAmount ?? sub.subtotal ?? 0)}</td>
                      <td className="px-4 py-3.5">
                        <SubStatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          subscription={sub}
                          onView={(s) => navigate(`${basePath}/subscriptions/${s.id || s._id}`)}
                          onPause={handlePause}
                          onResume={handleResume}
                          onClose={handleClose}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Pagination ── */}
        <div className="border-t border-border/60 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {subscriptions.length === 0 ? 0 : (pagination.page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(pagination.page * pageSize, pagination.total || 0)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total || 0}</span> subscriptions
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="size-8 rounded-lg flex items-center justify-center border border-border/70 hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="size-4" />
              </button>

              {[...Array(pagination.totalPages || 1)].map((_, i) => {
                const p = i + 1
                const isActive = p === pagination.page
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`size-8 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-[#2563EB] text-white"
                        : "border border-border/70 text-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= (pagination.totalPages || 1)}
                className="size-8 rounded-lg flex items-center justify-center border border-border/70 hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 rounded-lg border border-border/70 bg-background px-2 text-xs text-foreground focus:outline-none"
            >
              <option value={8}>8 / page</option>
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

