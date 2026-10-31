// src/pages/discounts/DiscountListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import {
  fetchDiscounts,
  fetchDiscountStats,
  updateDiscountStatus,
  setFilters,
} from "@/redux/Slices/discountSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  Tag,
  CheckCircle2,
  XCircle,
  BarChart2,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Pencil,
  Eye,
  Power,
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
    red: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
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
          {value ?? 0}
        </p>
      </div>
    </div>
  )
}

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

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────

function RowActions({ discount, onEdit, onView, onToggleStatus }) {
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
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Discount actions"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-border/80 bg-card p-1 shadow-lg shadow-black/5 animate-in fade-in-50 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEdit(discount)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onView(discount)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            View Details
          </button>
          <div className="h-px bg-border/60 my-1" />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onToggleStatus(discount)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <Power className="size-3.5 text-muted-foreground" />
            {discount.isActive ? "Set Inactive" : "Set Active"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main DiscountListPage ────────────────────────────────────────────────────

export default function DiscountListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { discounts, pagination, stats, loading, error } = useSelector(
    (state) => state.discount
  )

  const [searchInput, setSearchInput] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("")
  const [selectedType, setSelectedType] = React.useState("")
  const [selectedScope, setSelectedScope] = React.useState("")
  const [pageSize, setPageSize] = React.useState(8)

  // Fetch stats on mount
  React.useEffect(() => {
    dispatch(fetchDiscountStats())
  }, [dispatch])

  const loadData = React.useCallback(
    (page = 1) => {
      const params = { page, limit: pageSize }
      if (searchInput.trim()) params.search = searchInput.trim()
      if (selectedStatus !== "") params.isActive = selectedStatus === "active"
      if (selectedType) params.type = selectedType
      if (selectedScope) params.appliesTo = selectedScope
      dispatch(fetchDiscounts(params))
    },
    [dispatch, pageSize, searchInput, selectedStatus, selectedType, selectedScope]
  )

  React.useEffect(() => {
    loadData(1)
  }, [loadData])

  function handleReset() {
    setSearchInput("")
    setSelectedStatus("")
    setSelectedType("")
    setSelectedScope("")
    dispatch(setFilters({ search: "", isActive: "", type: "", appliesTo: "" }))
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      loadData(newPage)
    }
  }

  function handleToggleStatus(discount) {
    const id = discount.id || discount._id
    dispatch(updateDiscountStatus({ id, isActive: !discount.isActive })).then(() => {
      dispatch(fetchDiscountStats())
    })
  }

  function formatDiscountValue(discount) {
    if (discount.type === "percentage") return `${discount.value}%`
    return formatCurrency(discount.value)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            Discounts
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
            Manage promotional discounts and eligibility rules.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/discounts/new`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          Create Discount
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Tag} label="Total Discounts" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle2} label="Active Discounts" value={stats.active} color="emerald" />
        <StatCard icon={XCircle} label="Inactive Discounts" value={stats.inactive} color="red" />
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
              onKeyDown={(e) => { if (e.key === "Enter") loadData(1) }}
              placeholder="Search by name or code..."
              className="w-full h-10 rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/60 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[120px]"
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>

            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[120px]"
            >
              <option value="">All Scope</option>
              <option value="products">Specific Products</option>
              <option value="subscription">Subscription</option>
              <option value="all">All Products</option>
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

      {/* ── Table ── */}
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
                <th className="px-4 py-3.5">Discount Name</th>
                <th className="px-4 py-3.5">Code</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Value</th>
                <th className="px-4 py-3.5">Min. Purchase</th>
                <th className="px-4 py-3.5">Usage</th>
                <th className="px-4 py-3.5">Limit</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">End Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4" colSpan={12}>
                      <div className="h-4 bg-muted rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                    <Tag className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No discounts found. Click "Create Discount" to add one.</p>
                  </td>
                </tr>
              ) : (
                discounts.map((discount, idx) => {
                  const id = discount.id || discount._id
                  return (
                    <tr
                      key={id || idx}
                      onClick={() => navigate(`${basePath}/discounts/${id}`)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                        {(pagination.page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground max-w-[180px] truncate">
                        {discount.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                          {discount.code}
                        </code>
                      </td>
                      <td className="px-4 py-3.5">
                        <TypeBadge type={discount.type} />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {formatDiscountValue(discount)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {discount.minimumPurchase
                          ? formatCurrency(discount.minimumPurchase)
                          : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-foreground text-xs">
                        {discount.currentUsage ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {discount.usageLimit ?? <span className="text-muted-foreground/50">∞</span>}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatDate(discount.startDate)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatDate(discount.endDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={discount.isActive} />
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          discount={discount}
                          onEdit={(d) => navigate(`${basePath}/discounts/${d.id || d._id}/edit`)}
                          onView={(d) => navigate(`${basePath}/discounts/${d.id || d._id}`)}
                          onToggleStatus={handleToggleStatus}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="border-t border-border/60 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {discounts.length === 0 ? 0 : (pagination.page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(pagination.page * pageSize, pagination.total || 0)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{pagination.total || 0}</span>{" "}
            discounts
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
