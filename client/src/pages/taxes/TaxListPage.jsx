// src/pages/taxes/TaxListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchTaxes,
  fetchTaxStats,
  createTax,
  updateTax,
  updateTaxStatus,
  setFilters,
} from "@/redux/Slices/taxSlice"
import { formatDate } from "@/lib/formatters"
import {
  Percent,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react"

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const colorMap = {
    blue: "bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    red: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400",
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

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

function RowActions({ tax, onEdit, onToggleStatus }) {
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
        className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        aria-label="Tax actions"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-40 rounded-xl border border-border/80 bg-card p-1 shadow-lg shadow-black/5 animate-in fade-in-50 zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEdit(tax)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            Edit Tax
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onToggleStatus(tax)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Power className="size-3.5 text-muted-foreground" />
            {tax.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main TaxListPage Component ───────────────────────────────────────────────

export default function TaxListPage() {
  const dispatch = useDispatch()

  const { taxes, pagination, stats, filters, loading, actionLoading, error } =
    useSelector((state) => state.tax)

  const [searchInput, setSearchInput] = React.useState(filters.search || "")
  const [selectedStatus, setSelectedStatus] = React.useState(filters.isActive || "")
  const [pageSize, setPageSize] = React.useState(8)

  // Modal State
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingTax, setEditingTax] = React.useState(null)
  const [modalForm, setModalForm] = React.useState({
    name: "",
    rate: "",
    description: "",
    isDefault: false,
  })
  const [modalError, setModalError] = React.useState("")

  React.useEffect(() => {
    dispatch(fetchTaxStats())
  }, [dispatch])

  const loadData = React.useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: pageSize,
      }
      if (searchInput.trim()) params.search = searchInput.trim()
      if (selectedStatus !== "") params.isActive = selectedStatus === "active"

      dispatch(fetchTaxes(params))
    },
    [dispatch, pageSize, searchInput, selectedStatus]
  )

  React.useEffect(() => {
    loadData(1)
  }, [loadData])

  function handleReset() {
    setSearchInput("")
    setSelectedStatus("")
    dispatch(setFilters({ search: "", isActive: "" }))
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      loadData(newPage)
    }
  }

  function handleOpenCreate() {
    setEditingTax(null)
    setModalForm({ name: "", rate: "", description: "", isDefault: false })
    setModalError("")
    setModalOpen(true)
  }

  function handleOpenEdit(tax) {
    setEditingTax(tax)
    setModalForm({
      name: tax.name || "",
      rate: tax.rate != null ? String(tax.rate) : "",
      description: tax.description || "",
      isDefault: Boolean(tax.isDefault),
    })
    setModalError("")
    setModalOpen(true)
  }

  function handleToggleStatus(tax) {
    const id = tax.id || tax._id
    dispatch(updateTaxStatus({ id, isActive: !tax.isActive })).then(() => {
      dispatch(fetchTaxStats())
    })
  }

  function handleSaveModal(e) {
    e.preventDefault()
    setModalError("")

    if (!modalForm.name.trim()) {
      setModalError("Tax name is required")
      return
    }

    const rateNum = Number(modalForm.rate)
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      setModalError("Percentage rate must be between 0 and 100")
      return
    }

    const payload = {
      name: modalForm.name.trim(),
      rate: rateNum,
      description: modalForm.description.trim(),
      isDefault: modalForm.isDefault,
    }

    if (editingTax) {
      const id = editingTax.id || editingTax._id
      dispatch(updateTax({ id, payload })).then((res) => {
        if (!res.error) {
          setModalOpen(false)
          dispatch(fetchTaxStats())
        } else {
          setModalError(res.payload || "Failed to update tax")
        }
      })
    } else {
      dispatch(createTax(payload)).then((res) => {
        if (!res.error) {
          setModalOpen(false)
          dispatch(fetchTaxStats())
        } else {
          setModalError(res.payload || "Failed to create tax")
        }
      })
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            Taxes
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
            Manage tax configurations for your products.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          Add Tax
        </button>
      </div>

      {/* ── 3 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Percent}
          label="Total Taxes"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Taxes"
          value={stats.active}
          color="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Inactive Taxes"
          value={stats.inactive}
          color="red"
        />
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadData(1)
              }}
              placeholder="Search by tax name..."
              className="w-full h-10 rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition min-w-[130px]"
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
                <th className="px-4 py-3.5">Tax Name</th>
                <th className="px-4 py-3.5">Percentage Rate</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-4 bg-muted rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : taxes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Percent className="size-8 mx-auto mb-2 opacity-40" />
                    No taxes configured yet. Click "Add Tax" to create a tax configuration.
                  </td>
                </tr>
              ) : (
                taxes.map((tax, idx) => {
                  const id = tax.id || tax._id
                  return (
                    <tr
                      key={id || idx}
                      onClick={() => handleOpenEdit(tax)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                        {(pagination.page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {tax.name}
                        {tax.isDefault && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-[#2563EB] dark:bg-blue-950 dark:text-blue-300 font-semibold">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {tax.rate}%
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={tax.isActive} />
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatDate(tax.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          tax={tax}
                          onEdit={handleOpenEdit}
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
              {taxes.length === 0 ? 0 : (pagination.page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(pagination.page * pageSize, pagination.total || 0)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total || 0}</span> taxes
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

      {/* ── Add / Edit Tax Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {editingTax ? "Edit Tax Configuration" : "Add New Tax"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="size-3.5 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Tax Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="e.g. GST, VAT, Service Tax"
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Percentage Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={modalForm.rate}
                  onChange={(e) => setModalForm({ ...modalForm, rate: e.target.value })}
                  placeholder="e.g. 18"
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  placeholder="Tax description or notes..."
                  className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultTax"
                  checked={modalForm.isDefault}
                  onChange={(e) => setModalForm({ ...modalForm, isDefault: e.target.checked })}
                  className="size-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <label htmlFor="isDefaultTax" className="text-xs text-foreground cursor-pointer">
                  Set as default tax configuration
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border/70 bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1d4ed8] disabled:opacity-50 transition cursor-pointer"
                >
                  {actionLoading && <Loader2 className="size-3.5 animate-spin" />}
                  {editingTax ? "Save Changes" : "Create Tax"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

