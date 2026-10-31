// src/pages/discounts/DiscountDetailPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  fetchDiscountById,
  updateDiscountStatus,
  clearSelectedDiscount,
} from "@/redux/Slices/discountSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ChevronLeft,
  CalendarDays,
  Pencil,
  ChevronDown,
  Power,
  Loader2,
  AlertCircle,
  Tag,
  BarChart2,
  Clock,
  ShieldCheck,
  FileText,
  Users,
} from "lucide-react"

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60">
      <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
      Inactive
    </span>
  )
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  if (type === "percentage") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
        Percentage
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60">
      Fixed
    </span>
  )
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-border/50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[140px]">
        {label}
      </span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  )
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#2563EB] text-[#2563EB]"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────
function ActionsDropdown({ discount, onToggleStatus }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        Actions
        <ChevronDown className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-border/80 bg-card p-1 shadow-lg shadow-black/5 animate-in fade-in-50 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onToggleStatus(discount)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <Power className="size-3.5 text-muted-foreground" />
            {discount.isActive ? "Set Inactive" : "Set Active"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className="bg-[#2563EB] h-2 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Usage History", "Applied Quotations"]

// ─── Main DiscountDetailPage ──────────────────────────────────────────────────
export default function DiscountDetailPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedDiscount: discount, detailLoading, actionLoading, error } = useSelector(
    (state) => state.discount
  )

  const [activeTab, setActiveTab] = React.useState("Overview")

  React.useEffect(() => {
    if (id) dispatch(fetchDiscountById(id))
    return () => dispatch(clearSelectedDiscount())
  }, [dispatch, id])

  function handleToggleStatus(d) {
    const discId = d.id || d._id
    dispatch(updateDiscountStatus({ id: discId, isActive: !d.isActive }))
  }

  function formatValue(d) {
    if (!d) return "—"
    if (d.type === "percentage") return `${d.value}%`
    return formatCurrency(d.value)
  }

  function formatAppliesTo(val) {
    const map = { all: "All Products", products: "Specific Products", subscription: "Subscription" }
    return map[val] || val || "—"
  }

  // ── Loading State ──────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs text-muted-foreground">Loading discount details...</p>
      </div>
    )
  }

  if (error && !discount) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertCircle className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load discount</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!discount) return null

  const discId = discount.id || discount._id
  const currentUsage = discount.currentUsage ?? 0
  const usageLimit = discount.usageLimit

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          to={`${basePath}/discounts`}
          className="hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Discounts
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{discount.code}</span>
      </nav>

      {/* ── Title Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
              {discount.name}
            </h1>
            <StatusBadge isActive={discount.isActive} />
          </div>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground text-xs">
              {discount.code}
            </code>
            <span>•</span>
            <span>{formatValue(discount)}</span>
            <span>•</span>
            <span>
              {formatDate(discount.startDate)} – {formatDate(discount.endDate)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/discounts/${discId}/edit`)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] transition-colors cursor-pointer"
          >
            <Pencil className="size-4" />
            Edit
          </button>
          <ActionsDropdown discount={discount} onToggleStatus={handleToggleStatus} />
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="border-b border-border/60 flex gap-0">
        {TABS.map((tab) => (
          <TabBtn key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </TabBtn>
        ))}
      </div>

      {/* ════════ OVERVIEW TAB ════════ */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left: Discount Information ── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
                <Tag className="size-4 text-[#2563EB]" />
                <h2 className="text-base font-semibold text-foreground">
                  Discount Information
                </h2>
              </div>
              <div className="px-6 py-2">
                <DetailRow label="Discount Name">{discount.name || "—"}</DetailRow>
                <DetailRow label="Discount Code">
                  <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                    {discount.code || "—"}
                  </code>
                </DetailRow>
                <DetailRow label="Type">
                  <TypeBadge type={discount.type} />
                </DetailRow>
                <DetailRow label="Value">{formatValue(discount)}</DetailRow>
                <DetailRow label="Applies To">
                  {formatAppliesTo(discount.appliesTo)}
                </DetailRow>
                <DetailRow label="Minimum Purchase">
                  {discount.minimumPurchase
                    ? formatCurrency(discount.minimumPurchase)
                    : <span className="text-muted-foreground/60">No minimum</span>}
                </DetailRow>
                <DetailRow label="Usage Limit">
                  {usageLimit != null ? usageLimit : <span className="text-muted-foreground/60">Unlimited</span>}
                </DetailRow>
                <DetailRow label="Current Usage">{currentUsage}</DetailRow>
                <DetailRow label="Status">
                  <StatusBadge isActive={discount.isActive} />
                </DetailRow>
                {discount.description && (
                  <DetailRow label="Description">{discount.description}</DetailRow>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Validity Period */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
                <CalendarDays className="size-4 text-[#2563EB]" />
                <h2 className="text-base font-semibold text-foreground">Validity Period</h2>
              </div>
              <div className="px-6 py-2">
                <DetailRow label="Start Date">
                  {discount.startDate ? formatDate(discount.startDate) : "—"}
                </DetailRow>
                <DetailRow label="End Date">
                  {discount.endDate ? formatDate(discount.endDate) : "—"}
                </DetailRow>
              </div>
            </div>

            {/* Usage Summary */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
                <BarChart2 className="size-4 text-[#2563EB]" />
                <h2 className="text-base font-semibold text-foreground">Usage Summary</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Times Used
                  </p>
                  <p className="text-4xl font-bold text-foreground">{currentUsage}</p>
                </div>

                {usageLimit != null ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{currentUsage} of {usageLimit} uses</span>
                      <span>
                        {usageLimit > 0
                          ? `${Math.round((currentUsage / usageLimit) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                    <ProgressBar value={currentUsage} max={usageLimit} />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No usage limit set.</p>
                )}
              </div>
            </div>

            {/* Audit Information */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
                <Clock className="size-4 text-[#2563EB]" />
                <h2 className="text-base font-semibold text-foreground">Audit Information</h2>
              </div>
              <div className="px-6 py-2">
                <DetailRow label="Created Date">
                  {discount.createdAt ? formatDate(discount.createdAt) : "—"}
                </DetailRow>
                <DetailRow label="Last Updated">
                  {discount.updatedAt ? formatDate(discount.updatedAt) : "—"}
                </DetailRow>
                <DetailRow label="Created By">
                  {typeof discount.createdBy === "object"
                    ? discount.createdBy?.name || discount.createdBy?.email || "—"
                    : discount.createdBy || "—"}
                </DetailRow>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ USAGE HISTORY TAB ════════ */}
      {activeTab === "Usage History" && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
            <Clock className="size-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-foreground">Usage History</h2>
          </div>

          {Array.isArray(discount.usageHistory) && discount.usageHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="px-4 py-3.5">#</th>
                    <th className="px-4 py-3.5">Used By</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Order / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {discount.usageHistory.map((entry, idx) => (
                    <tr key={entry.id || entry._id || idx} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 text-foreground text-sm">
                        {entry.usedBy?.name || entry.usedBy || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {entry.usedAt ? formatDate(entry.usedAt) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {entry.reference || entry.orderId || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Clock className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No usage history recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ════════ APPLIED QUOTATIONS TAB ════════ */}
      {activeTab === "Applied Quotations" && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
            <FileText className="size-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-foreground">Applied Quotations</h2>
          </div>

          {Array.isArray(discount.appliedQuotations) && discount.appliedQuotations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="px-4 py-3.5">#</th>
                    <th className="px-4 py-3.5">Quotation</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {discount.appliedQuotations.map((q, idx) => (
                    <tr key={q.id || q._id || idx} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-medium text-foreground text-sm">
                        {q.number || q.reference || `#${q.id || q._id}`}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {q.customer?.name || q.customerName || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-foreground text-sm">
                        {q.total != null ? formatCurrency(q.total) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {q.createdAt ? formatDate(q.createdAt) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {q.status ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border/60 capitalize">
                            {q.status}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <FileText className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">This discount hasn't been applied to any quotations yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
