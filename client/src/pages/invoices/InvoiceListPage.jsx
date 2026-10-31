// src/pages/invoices/InvoiceListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import {
  fetchInvoices,
  fetchInvoiceStats,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
} from "@/redux/Slices/invoiceSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import GenerateInvoiceModal from "@/components/invoices/GenerateInvoiceModal"
import {
  FileText,
  Edit,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Send,
  Ban,
} from "lucide-react"

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const colorMap = {
    blue: "bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400",
    slate: "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    red: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400",
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
          {value ?? 0}
        </p>
      </div>
    </div>
  )
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function InvoiceStatusBadge({ status }) {
  const st = (status || "draft").toLowerCase()
  const map = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
    draft: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300",
    overdue: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-300",
    cancelled: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300",
  }
  const dotMap = {
    paid: "bg-emerald-500",
    confirmed: "bg-blue-500",
    draft: "bg-slate-400",
    overdue: "bg-red-500",
    cancelled: "bg-orange-500",
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[st] || map.draft}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${dotMap[st] || dotMap.draft}`} />
      {st.charAt(0).toUpperCase() + st.slice(1)}
    </span>
  )
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

function RowActions({ invoice, onView, onConfirm, onSend, onCancel }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  const st = (invoice.status || "").toLowerCase()

  React.useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition"
      >
        <MoreVertical className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-border/80 bg-popover shadow-lg py-1 text-sm">
          <button
            type="button"
            onClick={() => { setOpen(false); onView(invoice) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-muted transition"
          >
            <Eye className="size-4 text-muted-foreground" /> View Details
          </button>
          {(st === "draft") && (
            <button
              type="button"
              onClick={() => { setOpen(false); onConfirm(invoice) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-muted transition"
            >
              <CheckCircle className="size-4 text-blue-500" /> Confirm Invoice
            </button>
          )}
          {(st === "confirmed" || st === "draft") && (
            <button
              type="button"
              onClick={() => { setOpen(false); onSend(invoice) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-muted transition"
            >
              <Send className="size-4 text-muted-foreground" /> Send Invoice
            </button>
          )}
          {(st !== "cancelled" && st !== "paid") && (
            <button
              type="button"
              onClick={() => { setOpen(false); onCancel(invoice) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-muted text-red-600 transition"
            >
              <Ban className="size-4" /> Cancel Invoice
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Quick Action Modals (inline confirm / cancel / send) ────────────────────

function QuickConfirmModal({ invoice, onClose, onDone }) {
  const dispatch = useDispatch()
  const { actionLoading } = useSelector((s) => s.invoice)
  function handleConfirm() {
    dispatch(confirmInvoice(invoice.id || invoice._id)).then(() => { onDone(); onClose() })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="size-11 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <CheckCircle className="size-5 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Confirm Invoice</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to confirm invoice{" "}
          <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>? This will mark the invoice as confirmed.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {actionLoading ? "Confirming..." : "Confirm Invoice"}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuickCancelModal({ invoice, onClose, onDone }) {
  const dispatch = useDispatch()
  const { actionLoading } = useSelector((s) => s.invoice)
  function handleCancel() {
    dispatch(cancelInvoice({ id: invoice.id || invoice._id, reason: "Cancelled from list" })).then(() => { onDone(); onClose() })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="size-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="size-5 text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Cancel Invoice</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to cancel invoice{" "}
          <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition"
          >
            {actionLoading ? "Cancelling..." : "Cancel Invoice"}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuickSendModal({ invoice, onClose, onDone }) {
  const dispatch = useDispatch()
  const { actionLoading } = useSelector((s) => s.invoice)
  const defaultEmail =
    invoice.customerId?.userId?.email ||
    invoice.customerEmail ||
    ""
  const [email, setEmail] = React.useState(defaultEmail)

  function handleSend() {
    dispatch(sendInvoice({ id: invoice.id || invoice._id, email })).then(() => { onDone(); onClose() })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="size-11 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <Send className="size-5 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Send Invoice</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Send this invoice to the customer via email. Invoice PDF will be attached.
        </p>
        <div className="mb-5">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Recipient Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={actionLoading || !email}
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {actionLoading ? "Sending..." : "Send Invoice"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvoiceListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { invoices, loading, stats, pagination } = useSelector((s) => s.invoice)

  // Filters
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [pageSize, setPageSize] = React.useState(8)
  const [currentPage, setCurrentPage] = React.useState(1)

  // Modals
  const [showGenerateModal, setShowGenerateModal] = React.useState(false)
  const [confirmTarget, setConfirmTarget] = React.useState(null)
  const [cancelTarget, setCancelTarget] = React.useState(null)
  const [sendTarget, setSendTarget] = React.useState(null)

  // Derive base path
  const basePath = location.pathname.replace(/\/invoices.*/, "")

  function loadInvoices(page = currentPage) {
    dispatch(
      fetchInvoices({
        page,
        limit: pageSize,
        status: statusFilter || undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
    )
  }

  React.useEffect(() => {
    dispatch(fetchInvoiceStats())
    loadInvoices(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    setCurrentPage(1)
    loadInvoices(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pageSize])

  function handleSearch(e) {
    e.preventDefault()
    setCurrentPage(1)
    loadInvoices(1)
  }

  function handleReset() {
    setSearch("")
    setStatusFilter("")
    setDateFrom("")
    setDateTo("")
    setCurrentPage(1)
    dispatch(fetchInvoices({ page: 1, limit: pageSize }))
  }

  function handlePageChange(p) {
    if (p < 1 || p > (pagination.totalPages || 1)) return
    setCurrentPage(p)
    dispatch(
      fetchInvoices({
        page: p,
        limit: pageSize,
        status: statusFilter || undefined,
        search: search || undefined,
      })
    )
  }

  const paginationInfo = pagination || { page: currentPage, totalPages: 1, total: invoices.length }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage customer invoices and outstanding balances.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground bg-card hover:bg-muted transition"
            >
              <FileText className="size-4" />
              Generate Invoice
            </button>
            <button
              type="button"
              onClick={() => navigate(`${basePath}/invoices/create`)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus className="size-4" />
              Create Invoice
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <StatCard icon={FileText} label="Total Invoices" value={stats?.total ?? invoices.length} color="blue" />
          <StatCard icon={Edit} label="Draft" value={stats?.draft ?? 0} color="slate" />
          <StatCard icon={CheckCircle} label="Confirmed" value={stats?.confirmed ?? 0} color="blue" />
          <StatCard icon={CheckCircle2} label="Paid" value={stats?.paid ?? 0} color="emerald" />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue ?? 0} color="red" />
          <StatCard icon={XCircle} label="Cancelled" value={stats?.cancelled ?? 0} color="orange" />
        </div>

        {/* ── Table Card ── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">

          {/* Filters */}
          <div className="px-4 py-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 flex-wrap">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <button
                type="submit"
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm hover:bg-muted transition shrink-0"
              >
                Search
              </button>
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-sm text-muted-foreground hover:bg-muted transition shrink-0"
            >
              <RotateCcw className="size-4" />
              Reset
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3.5 w-10 text-left">#</th>
                  <th className="px-4 py-3.5 text-left">Invoice Number</th>
                  <th className="px-4 py-3.5 text-left">Customer</th>
                  <th className="px-4 py-3.5 text-left">Subscription</th>
                  <th className="px-4 py-3.5 text-left">Invoice Date</th>
                  <th className="px-4 py-3.5 text-left">Due Date</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5 text-right">Paid</th>
                  <th className="px-4 py-3.5 text-right">Outstanding</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  [...Array(pageSize)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4" colSpan={11}>
                        <div className="h-4 bg-muted rounded-md w-full" />
                      </td>
                    </tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                      <FileText className="size-8 mx-auto mb-2 opacity-40" />
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, idx) => {
                    const id = inv.id || inv._id
                    const customerName =
                      inv.customerId?.companyName ||
                      inv.customerId?.name ||
                      inv.customerId?.userId?.name ||
                      inv.customer?.companyName ||
                      inv.customer?.name ||
                      inv.customerName ||
                      "—"
                    const subNumber =
                      inv.subscriptionId?.subscriptionNumber ||
                      inv.subscription?.subscriptionNumber ||
                      inv.subscriptionNumber ||
                      "—"
                    const total = inv.totalAmount ?? inv.total ?? 0
                    const paid = inv.paidAmount ?? inv.paid ?? 0
                    const outstanding = inv.outstandingAmount ?? Math.max(0, total - paid)

                    return (
                      <tr
                        key={id || idx}
                        onClick={() => navigate(`${basePath}/invoices/${id}`)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                          {(paginationInfo.page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/invoices/${id}`) }}
                            className="font-medium text-blue-600 hover:underline font-mono text-xs cursor-pointer"
                          >
                            {inv.invoiceNumber || (id ? `INV-${id.slice(-6).toUpperCase()}` : `INV-${String(idx + 1).padStart(4, "0")}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-foreground">{customerName}</td>
                        <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{subNumber}</td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                          {formatCurrency(total)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-emerald-600 font-medium">
                          {formatCurrency(paid)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium">
                          <span className={outstanding > 0 ? "text-red-500" : "text-emerald-600"}>
                            {formatCurrency(outstanding)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <RowActions
                            invoice={inv}
                            onView={(i) => navigate(`${basePath}/invoices/${i.id || i._id}`)}
                            onConfirm={(i) => setConfirmTarget(i)}
                            onSend={(i) => setSendTarget(i)}
                            onCancel={(i) => setCancelTarget(i)}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-border/60 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-medium text-foreground">
                {invoices.length === 0 ? 0 : (paginationInfo.page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(paginationInfo.page * pageSize, paginationInfo.total || 0)}
              </span>{" "}
              of <span className="font-medium text-foreground">{paginationInfo.total || 0}</span> invoices
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(paginationInfo.page - 1)}
                  disabled={paginationInfo.page <= 1}
                  className="size-8 rounded-lg flex items-center justify-center border border-border/70 hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {[...Array(Math.min(paginationInfo.totalPages || 1, 7))].map((_, i) => {
                  const p = i + 1
                  const isActive = p === paginationInfo.page
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
                  onClick={() => handlePageChange(paginationInfo.page + 1)}
                  disabled={paginationInfo.page >= (paginationInfo.totalPages || 1)}
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

      {/* ── Modals ── */}
      {showGenerateModal && (
        <GenerateInvoiceModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            loadInvoices(1)
          }}
        />
      )}
      {confirmTarget && (
        <QuickConfirmModal
          invoice={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onDone={() => loadInvoices(currentPage)}
        />
      )}
      {cancelTarget && (
        <QuickCancelModal
          invoice={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onDone={() => loadInvoices(currentPage)}
        />
      )}
      {sendTarget && (
        <QuickSendModal
          invoice={sendTarget}
          onClose={() => setSendTarget(null)}
          onDone={() => loadInvoices(currentPage)}
        />
      )}
    </div>
  )
}
