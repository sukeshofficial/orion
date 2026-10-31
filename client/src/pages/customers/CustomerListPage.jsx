// src/pages/customers/CustomerListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import {
  fetchCustomers,
  fetchCustomerStats,
  setFilters,
} from "@/redux/Slices/customerSlice"
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function isWithinLast30Days(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / (1000 * 60 * 60 * 24)
  return diff <= 30
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const colorMap = {
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    violet: "bg-violet-50 text-violet-600",
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

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
      <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
      Inactive
    </span>
  )
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/60">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-md bg-muted animate-pulse w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────

function RowActions({ customer, onView, onEdit }) {
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
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Row actions"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-border/80 bg-white dark:bg-[#111827] shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onView(customer) }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
          >
            <Eye className="size-3.5" />
            View
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(customer) }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function buildPageWindows(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current])
  if (current > 1) pages.add(current - 1)
  if (current < total) pages.add(current + 1)
  return Array.from(pages).sort((a, b) => a - b)
}

function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pageWindows = buildPageWindows(page, totalPages)

  if (totalPages <= 1 && total === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-4">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}–{end}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> customers
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="size-8 flex items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pageWindows.map((p, idx) => {
          const prev = pageWindows[idx - 1]
          const showEllipsis = prev && p - prev > 1
          return (
            <React.Fragment key={p}>
              {showEllipsis && (
                <span className="size-8 flex items-center justify-center text-sm text-muted-foreground">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`size-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors border ${
                  p === page
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "border-border/80 text-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            </React.Fragment>
          )
        })}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="size-8 flex items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { customers, loading, error, pagination, filters } = useSelector(
    (s) => s.customer
  )

  // Determine base path (admin or staff)
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  // Local search state for debounce
  const [searchInput, setSearchInput] = React.useState(filters.search)
  const [currentPage, setCurrentPage] = React.useState(1)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchInput }))
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, dispatch])

  // Fetch stats once on mount (no filter, tiny limit=1 × 3 calls)
  React.useEffect(() => {
    dispatch(fetchCustomerStats())
  }, [dispatch])

  // Fetch whenever filters or page change
  React.useEffect(() => {
    const params = {
      page: currentPage,
      limit: 8,
    }
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    dispatch(fetchCustomers(params))
  }, [dispatch, currentPage, filters.search, filters.status])

  // Stats from Redux (accurate totals, not per-page counts)
  const stats = useSelector((s) => s.customer.stats)
  const newCount = customers.filter((c) => isWithinLast30Days(c.createdAt)).length

  // Handlers
  const handleStatusChange = (e) => {
    dispatch(setFilters({ status: e.target.value }))
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchInput("")
    dispatch(setFilters({ search: "", status: "" }))
    setCurrentPage(1)
  }

  const handleView = (customer) => navigate(`${basePath}/customers/${customer.id}`)
  const handleEdit = (customer) => navigate(`${basePath}/customers/${customer.id}/edit`)
  const handleRowClick = (customer) => navigate(`${basePath}/customers/${customer.id}`)

  const handleRetry = () => {
    dispatch(fetchCustomers({ page: currentPage, limit: 8, ...filters }))
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            Customers
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
            Manage your customer relationships.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/customers/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors self-start sm:self-auto shrink-0"
        >
          <UserPlus className="size-4" />
          Add Customer
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Customers" value={stats.loaded ? stats.total : pagination.total} color="blue" />
        <StatCard icon={UserCheck} label="Active Customers" value={stats.loaded ? stats.active : "—"} color="emerald" />
        <StatCard icon={UserX} label="Inactive" value={stats.loaded ? stats.inactive : "—"} color="red" />
        <StatCard icon={UserPlus} label="New (30 days)" value={newCount} color="violet" />
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email or company..."
              className="w-full h-9 rounded-xl border border-border/70 bg-white pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/60 dark:bg-[#111827] dark:border-white/10 transition"
            />
          </div>
          {/* Status filter */}
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="h-9 rounded-xl border border-border/70 bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/60 dark:bg-[#111827] dark:border-white/10 transition min-w-[140px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border/70 bg-white text-sm font-medium text-foreground hover:bg-muted transition-colors dark:bg-[#111827] dark:border-white/10"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="size-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="size-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-foreground">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </button>
          </div>
        )}

        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-8">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer No.
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer Name
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Created Date
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {loading &&
                  [...Array(8)].map((_, i) => <SkeletonRow key={i} />)}

                {/* Data rows */}
                {!loading &&
                  customers.map((customer, idx) => {
                    const rowNumber = (pagination.page - 1) * pagination.limit + idx + 1
                    const name = customer.userId?.name ?? "—"
                    const email = customer.userId?.email ?? "—"
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => handleRowClick(customer)}
                        className="border-b border-border/60 hover:bg-[#EFF6FF]/40 dark:hover:bg-blue-950/10 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground">{rowNumber}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-[#2563EB]">
                            {customer.customerNumber ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[180px]">
                          {email}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground truncate max-w-[140px]">
                          {customer.companyName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {customer.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge isActive={customer.isActive} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <RowActions
                            customer={customer}
                            onView={handleView}
                            onEdit={handleEdit}
                          />
                        </td>
                      </tr>
                    )
                  })}

                {/* Empty state */}
                {!loading && customers.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="size-14 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/40 flex items-center justify-center">
                          <Users className="size-7 text-[#2563EB]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">No customers found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {filters.search || filters.status
                              ? "Try adjusting your filters or search terms."
                              : "Get started by adding your first customer."}
                          </p>
                        </div>
                        {!filters.search && !filters.status && (
                          <button
                            type="button"
                            onClick={() => navigate(`${basePath}/customers/new`)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                          >
                            <UserPlus className="size-4" />
                            Add Customer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && customers.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

