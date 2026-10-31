// src/pages/quotations/QuotationListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import {
  fetchQuotations,
  fetchQuotationStats,
  setFilters,
  confirmQuotation,
  cancelQuotation,
  convertQuotation,
} from "@/redux/Slices/quotationSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  FileText,
  FileCheck,
  Send,
  CheckCircle2,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  Pencil,
  Check,
  Ban,
  ArrowRightCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react"

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const colorMap = {
    blue: "bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
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

function QuotationStatusBadge({ status }) {
  const st = (status || "draft").toLowerCase()

  if (st === "confirmed" || st === "accepted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
        Accepted
      </span>
    )
  }
  if (st === "quotation" || st === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#2563EB] border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
        <span className="size-1.5 rounded-full bg-[#2563EB] shrink-0" />
        Sent
      </span>
    )
  }
  if (st === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
        Expired
      </span>
    )
  }
  if (st === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60">
        <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
        Cancelled
      </span>
    )
  }

  // Draft default
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
      <span className="size-1.5 rounded-full bg-neutral-500 shrink-0" />
      Draft
    </span>
  )
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

function RowActions({ quotation, onView, onEdit, onConfirm, onCancel, onConvert }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const status = (quotation.status || "").toLowerCase()
  const canEdit = status === "draft"
  const canConfirm = status === "draft" || status === "quotation"
  const canCancel = status !== "cancelled" && status !== "expired"
  const canConvert = status === "confirmed"

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        aria-label="Quotation actions"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-border/80 bg-card p-1 shadow-lg shadow-black/5 animate-in fade-in-50 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onView(quotation)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            View Details
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onEdit(quotation)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Pencil className="size-3.5 text-muted-foreground" />
              Edit Quotation
            </button>
          )}

          {canConfirm && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onConfirm(quotation)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
            >
              <Check className="size-3.5 text-emerald-600" />
              Confirm Quotation
            </button>
          )}

          {canConvert && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onConvert(quotation)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <ArrowRightCircle className="size-3.5 text-[#2563EB]" />
              Convert to Subscription
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onCancel(quotation)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Ban className="size-3.5 text-red-500" />
              Cancel Quotation
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main QuotationListPage Component ─────────────────────────────────────────

export default function QuotationListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { quotations, pagination, stats, filters, loading, error } = useSelector(
    (state) => state.quotation
  )

  const [searchInput, setSearchInput] = React.useState(filters.search || "")
  const [selectedStatus, setSelectedStatus] = React.useState(filters.status || "")
  const [pageSize, setPageSize] = React.useState(8)

  React.useEffect(() => {
    dispatch(fetchQuotationStats())
  }, [dispatch])

  const loadData = React.useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: pageSize,
      }
      if (searchInput.trim()) params.search = searchInput.trim()
      if (selectedStatus) params.status = selectedStatus

      dispatch(fetchQuotations(params))
    },
    [dispatch, pageSize, searchInput, selectedStatus]
  )

  React.useEffect(() => {
    loadData(1)
  }, [loadData])

  function handleReset() {
    setSearchInput("")
    setSelectedStatus("")
    dispatch(setFilters({ search: "", status: "", customerId: "", planId: "" }))
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      loadData(newPage)
    }
  }

  function handleConfirm(q) {
    const id = q.id || q._id
    dispatch(confirmQuotation(id)).then(() => {
      dispatch(fetchQuotationStats())
      loadData(pagination.page)
    })
  }

  function handleCancel(q) {
    const reason = prompt("Enter cancellation reason (optional):") || "Customer request"
    const id = q.id || q._id
    dispatch(cancelQuotation({ id, reason })).then(() => {
      dispatch(fetchQuotationStats())
      loadData(pagination.page)
    })
  }

  function handleConvert(q) {
    const id = q.id || q._id
    dispatch(convertQuotation(id)).then((res) => {
      if (!res.error) {
        alert("Quotation successfully converted to active subscription!")
        loadData(pagination.page)
      }
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            Quotations
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
            Manage your customer quotations and lifecycle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/quotations/new`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          Create Quotation
        </button>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Quotations"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={FileCheck}
          label="Draft"
          value={stats.draft}
          color="violet"
        />
        <StatCard
          icon={Send}
          label="Sent"
          value={stats.sent}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Accepted"
          value={stats.accepted}
          color="emerald"
        />
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
              placeholder="Search by quotation number or customer..."
              className="w-full h-10 rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[130px]"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Quotation">Sent / Quotation</option>
              <option value="Confirmed">Accepted / Confirmed</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
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
                <th className="px-4 py-3.5">Quotation No.</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Grand Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4" colSpan={9}>
                      <div className="h-4 bg-muted rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <FileText className="size-8 mx-auto mb-2 opacity-40" />
                    No quotations found. Click "Create Quotation" to launch the 5-step wizard.
                  </td>
                </tr>
              ) : (
                quotations.map((q, idx) => {
                  const id = q.id || q._id
                  const customerName =
                    q.customerId?.companyName ||
                    q.customerId?.userId?.name ||
                    q.customerName ||
                    "Customer"
                  const planName = q.planId?.name || "Subscription Plan"

                  return (
                    <tr
                      key={id || idx}
                      onClick={() => navigate(`${basePath}/quotations/${id}`)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                        {(pagination.page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground font-mono text-xs">
                        {q.quotationNumber}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {customerName}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {planName}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatDate(q.expiryDate)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {formatCurrency(q.grandTotal)}
                      </td>
                      <td className="px-4 py-3.5">
                        <QuotationStatusBadge status={q.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          quotation={q}
                          onView={(quot) =>
                            navigate(`${basePath}/quotations/${quot.id || quot._id}`)
                          }
                          onEdit={(quot) =>
                            navigate(`${basePath}/quotations/${quot.id || quot._id}/edit`)
                          }
                          onConfirm={handleConfirm}
                          onCancel={handleCancel}
                          onConvert={handleConvert}
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
              {quotations.length === 0 ? 0 : (pagination.page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(pagination.page * pageSize, pagination.total || 0)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total || 0}</span> quotations
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

