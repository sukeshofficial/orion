// src/pages/portal/InvoiceDetails.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams, Link } from "react-router-dom"
import { fetchInvoiceById } from "@/redux/Slices/invoiceSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  CreditCard,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  IndianRupee,
  Loader2,
} from "lucide-react"

export default function InvoiceDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { selectedInvoice: inv, detailLoading: loading } = useSelector(
    (state) => state.invoice
  )

  const [activeTab, setActiveTab] = React.useState("overview")

  React.useEffect(() => {
    if (id) {
      dispatch(fetchInvoiceById(id))
    }
  }, [dispatch, id])

  const invNum = inv?.invoiceNumber || "INV-2026-002"
  const total = inv?.totalAmount || inv?.total || 12000000
  const paid = inv?.paidAmount || 6000000
  const outstanding = Math.max(0, total - paid)
  const status = (inv?.status || "Overdue").toLowerCase()

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link
            to="/portal/invoices"
            className="text-xs text-slate-500 hover:text-blue-600 transition flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Invoices</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {invNum}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/50 capitalize">
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Issued Sep 15, 2026 · Due Oct 15, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="size-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Printer className="size-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ── 3 Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <IndianRupee className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Amount
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Paid Amount
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(paid)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Outstanding
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">
              {formatCurrency(outstanding)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-medium">
        {["overview", "items", "payments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition capitalize ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Invoice Information
            </h2>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Invoice Number</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {invNum}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Subscription</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">SUB-0011</span>
              </div>
              <div>
                <span className="text-slate-400 block">Plan</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Enterprise Plan
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Invoice Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Sep 15, 2026</span>
              </div>
              <div>
                <span className="text-slate-400 block">Due Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Oct 15, 2026</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-bold text-red-600 capitalize">{status}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </h2>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Name</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  Acme Corp
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  acme@company.com
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  +1 555 010 1234
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Company</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Acme Corporation
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

