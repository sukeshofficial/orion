// src/pages/products/ProductListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import {
  fetchProducts,
  fetchProductStats,
  setFilters,
  updateProductStatus,
} from "@/redux/Slices/productSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Pencil,
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
          {value}
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
  const display = (type || "service").charAt(0).toUpperCase() + (type || "service").slice(1)
  return (
    <span className="text-xs font-medium text-foreground">
      {display}
    </span>
  )
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

function RowActions({ product, onEdit, onToggleStatus }) {
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
        aria-label="Product actions"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-border/80 bg-card p-1 shadow-lg shadow-black/5 animate-in fade-in-50 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEdit(product)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            Edit Product
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onToggleStatus(product)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <Power className="size-3.5 text-muted-foreground" />
            {product.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main ProductListPage Component ───────────────────────────────────────────

export default function ProductListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { products, pagination, stats, filters, loading, error } = useSelector(
    (state) => state.product
  )

  const [searchInput, setSearchInput] = React.useState(filters.search || "")
  const [selectedType, setSelectedType] = React.useState(filters.type || "")
  const [selectedStatus, setSelectedStatus] = React.useState(filters.isActive || "")
  const [pageSize, setPageSize] = React.useState(8)

  // Fetch stats and product listing on mount and filter changes
  React.useEffect(() => {
    dispatch(fetchProductStats())
  }, [dispatch])

  const loadData = React.useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: pageSize,
      }
      if (searchInput.trim()) params.search = searchInput.trim()
      if (selectedType) params.type = selectedType
      if (selectedStatus !== "") params.isActive = selectedStatus === "active"

      dispatch(fetchProducts(params))
    },
    [dispatch, pageSize, searchInput, selectedType, selectedStatus]
  )

  React.useEffect(() => {
    loadData(1)
  }, [loadData])

  function handleReset() {
    setSearchInput("")
    setSelectedType("")
    setSelectedStatus("")
    dispatch(setFilters({ search: "", type: "", isActive: "" }))
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      loadData(newPage)
    }
  }

  function handleToggleStatus(product) {
    const id = product.id || product._id
    dispatch(updateProductStatus({ id, isActive: !product.isActive })).then(() => {
      dispatch(fetchProductStats())
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
            Manage your product catalogue and variants.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/products/new`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          Add Product
        </button>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Products"
          value={stats.active}
          color="emerald"
        />
        <StatCard
          icon={XCircle}
          label="Inactive Products"
          value={stats.inactive}
          color="red"
        />
        <StatCard
          icon={Layers}
          label="Total Variants"
          value={stats.totalVariants}
          color="blue"
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
              placeholder="Search by product name, type or description..."
              className="w-full h-10 rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/60 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[130px]"
            >
              <option value="">All Types</option>
              <option value="service">Service</option>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                <th className="px-4 py-3.5">Product Name</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Sales Price</th>
                <th className="px-4 py-3.5">Cost Price</th>
                <th className="px-4 py-3.5">Variants</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created Date</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <Package className="size-8 mx-auto mb-2 opacity-40" />
                    No products found. Click "Add Product" to create your first product.
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => {
                  const id = product.id || product._id
                  const variantCount = Array.isArray(product.variants) ? product.variants.length : 0
                  return (
                    <tr
                      key={id || idx}
                      onClick={() => navigate(`${basePath}/products/${id}/edit`)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                        {(pagination.page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {product.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <TypeBadge type={product.type} />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {formatCurrency(product.salesPrice)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="px-4 py-3.5 text-foreground">
                        {variantCount}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={product.isActive} />
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          product={product}
                          onEdit={(p) => navigate(`${basePath}/products/${p.id || p._id}/edit`)}
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

        {/* ── Table Footer / Pagination ── */}
        <div className="border-t border-border/60 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {products.length === 0 ? 0 : (pagination.page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(pagination.page * pageSize, pagination.total || 0)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{pagination.total || 0}</span> products
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

