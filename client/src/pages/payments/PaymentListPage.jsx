// src/pages/payments/PaymentListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  fetchPayments,
  fetchPaymentStats,
  setFilters,
  clearFilters,
} from "@/redux/Slices/paymentSlice"
import { fetchCustomers } from "@/redux/Slices/customerSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import RecordPaymentDialog from "@/components/payments/RecordPaymentDialog"
import {
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Receipt,
  IndianRupee,
} from "lucide-react"

export default function PaymentListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { payments, stats, pagination, filters, loading } = useSelector(
    (state) => state.payment
  )
  const { customers } = useSelector((state) => state.customer)

  const [search, setSearch] = React.useState(filters.search || "")
  const [method, setMethod] = React.useState(filters.method || "all")
  const [customer, setCustomer] = React.useState(filters.customerId || "all")
  const [dateRange, setDateRange] = React.useState("Oct 01, 2026 - Oct 31, 2026")
  const [showRecordModal, setShowRecordModal] = React.useState(false)
  const [activeMenuId, setActiveMenuId] = React.useState(null)

  // Pagination state
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(8)

  React.useEffect(() => {
    dispatch(fetchPaymentStats())
    dispatch(fetchCustomers({ limit: 100 }))
  }, [dispatch])

  React.useEffect(() => {
    dispatch(
      fetchPayments({
        search,
        method,
        customerId: customer,
        page,
        limit,
      })
    )
  }, [dispatch, search, method, customer, page, limit])

  const handleReset = () => {
    setSearch("")
    setMethod("all")
    setCustomer("all")
    setDateRange("Oct 01, 2026 - Oct 31, 2026")
    setPage(1)
    dispatch(clearFilters())
  }

  // Method badge color helper
  const getMethodBadge = (m = "") => {
    const lower = m.toLowerCase()
    if (lower.includes("card")) {
      return "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900/50"
    }
    if (lower.includes("upi")) {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
    }
    if (lower.includes("cheque")) {
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
    }
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900/50"
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage customer payments and their invoice status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRecordModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm self-start sm:self-center"
        >
          <Plus className="size-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* ── 6 Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Total Payments
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {stats?.totalPayments ?? payments.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <IndianRupee className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Total Amount Received
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(stats?.totalAmountReceived ?? 0)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Pending Amount
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(stats?.pendingAmount ?? 0)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Fully Paid Invoices
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {stats?.fullyPaidInvoices ?? 0}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Receipt className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Partially Paid
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {stats?.partiallyPaid ?? 0}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <XCircle className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Failed / Reversed
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {stats?.failedOrReversed ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payments by reference, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto justify-end">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
          </select>

          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Customers</option>
            {customers?.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-medium">
            {dateRange}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="size-8 animate-spin mb-2 text-blue-600" />
            <span className="text-xs">Loading payments...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No payments found matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Payment Reference</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map((pay, idx) => {
                  const pId = pay._id || pay.id || pay.paymentReference
                  const custName = pay.customer?.name || pay.customerName || (typeof pay.customer === 'string' ? pay.customer : "Customer")
                  const invNum = pay.invoice?.invoiceNumber || pay.invoiceNumber || (pay.invoice?._id ? `INV-${pay.invoice._id.slice(-6).toUpperCase()}` : "—")
                  const invId = pay.invoice?._id || pay.invoice?.id || pay.invoiceId || invNum
                  const paymentMethod = pay.paymentMethod || pay.method || "Bank Transfer"

                  return (
                    <tr key={pId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <Link
                          to={`${basePath}/payments/${pId}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          {pay.paymentReference || pId}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
                          {custName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`${basePath}/invoices/${invId}`}
                          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                          {invNum}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getMethodBadge(
                            paymentMethod
                          )}`}
                        >
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(pay.amount || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(pay.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {pay.notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === pId ? null : pId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {activeMenuId === pId && (
                          <div
                            onClick={() => setActiveMenuId(null)}
                            className="absolute right-4 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-30 text-left text-xs"
                          >
                            <Link
                              to={`${basePath}/payments/${pId}`}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Eye className="size-3.5" />
                              <span>View Details</span>
                            </Link>
                            <Link
                              to={`${basePath}/invoices/${invId}`}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                            >
                              <ExternalLink className="size-3.5" />
                              <span>View Invoice</span>
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {payments.length === 0 ? 0 : 1} to {payments.length} of {pagination?.total || payments.length} payments
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`size-6 rounded-lg font-semibold flex items-center justify-center transition ${
                  page === num
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => p + 1)}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <span className="ml-2 text-slate-400">8 / page</span>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onSuccess={() => dispatch(fetchPayments({}))}
      />
    </div>
  )
}

