// src/pages/portal/MyInvoices.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { fetchInvoices } from "@/redux/Slices/invoiceSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  FileText,
  Search,
  MoreVertical,
  Eye,
  Download,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Calendar,
} from "lucide-react"

export default function MyInvoices() {
  const dispatch = useDispatch()
  const { invoices, loading } = useSelector((state) => state.invoice)

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState("Oct 01, 2026 - Oct 31, 2026")
  const [activeMenuId, setActiveMenuId] = React.useState(null)

  React.useEffect(() => {
    dispatch(fetchInvoices({ limit: 50 }))
  }, [dispatch])

  const myInvoices = React.useMemo(() => {
    return (invoices || []).filter((inv) => {
      const q = search.toLowerCase()
      const invNum = (inv.invoiceNumber || inv.number || "").toLowerCase()
      const matchesSearch = !search || invNum.includes(q)
      const matchesStatus =
        statusFilter === "all" ||
        (inv.status || "").toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  const handleReset = () => {
    setSearch("")
    setStatusFilter("all")
    setDateRange("Oct 01, 2026 - Oct 31, 2026")
  }

  const handleDownloadPdf = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Invoices
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View and download your invoices and check payment status.
        </p>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Overdue">Overdue</option>
            <option value="Draft">Draft</option>
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
            <span className="text-xs">Loading invoices...</span>
          </div>
        ) : myInvoices.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No invoices found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {myInvoices.map((inv, idx) => {
                  const iId = inv._id || inv.id
                  const invNum = inv.invoiceNumber || inv.number || `INV-2026-00${idx + 1}`
                  const total = inv.totalAmount || inv.total || 5000000
                  const paid = inv.paidAmount || 0
                  const outstanding = Math.max(0, total - paid)
                  const status = (inv.status || "Paid").toLowerCase()

                  return (
                    <tr key={iId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <Link
                          to={`/portal/invoices/${iId}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {invNum}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(inv.invoiceDate || "2026-10-01")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(inv.dueDate || "2026-10-31")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(total)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          outstanding > 0 ? "text-red-600" : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {formatCurrency(outstanding)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            status === "paid"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : status === "overdue"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === iId ? null : iId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {activeMenuId === iId && (
                          <div
                            onClick={() => setActiveMenuId(null)}
                            className="absolute right-4 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-30 text-left text-xs"
                          >
                            <Link
                              to={`/portal/invoices/${iId}`}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Eye className="size-3.5" />
                              <span>View Invoice</span>
                            </Link>
                            <button
                              onClick={handleDownloadPdf}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Download className="size-3.5" />
                              <span>Download PDF</span>
                            </button>
                            <Link
                              to="/portal/payments"
                              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                            >
                              <Receipt className="size-3.5" />
                              <span>View Payment History</span>
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

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>Showing 1 to {myInvoices.length} of {myInvoices.length} invoices</div>
          <div className="flex items-center gap-1">
            <button className="size-6 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center">
              1
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

