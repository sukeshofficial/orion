// src/pages/invoices/InvoiceDetailPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import {
  fetchInvoiceById,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
} from "@/redux/Slices/invoiceSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import InvoiceActionModals from "@/components/invoices/InvoiceActionModals"
import {
  ArrowLeft,
  Mail,
  Printer,
  Download,
  MoreHorizontal,
  FileText,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Building,
  User,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  ExternalLink,
  Ban,
  Check,
} from "lucide-react"

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const {
    selectedInvoice: invoice,
    detailLoading: loading,
    actionLoading,
    error,
  } = useSelector((state) => state.invoice)

  const [activeTab, setActiveTab] = React.useState("overview")
  const [showMoreMenu, setShowMoreMenu] = React.useState(false)

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [showCancelModal, setShowCancelModal] = React.useState(false)
  const [showSendModal, setShowSendModal] = React.useState(false)
  const [showDownloadModal, setShowDownloadModal] = React.useState(false)
  const [showPrintModal, setShowPrintModal] = React.useState(false)

  React.useEffect(() => {
    if (id) {
      dispatch(fetchInvoiceById(id))
    }
  }, [dispatch, id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="size-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Loading invoice details...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <FileText className="size-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          {typeof error === "string" ? error : "The requested invoice could not be located."}
        </p>
        <Link
          to={`${basePath}/invoices`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <ArrowLeft className="size-4" />
          Back to Invoices
        </Link>
      </div>
    )
  }

  // Normalize data fields
  const invNumber = invoice.invoiceNumber || invoice.number || `INV-${(invoice._id || invoice.id || "").slice(-6).toUpperCase()}`
  const customerName = invoice.customer?.name || invoice.customerName || "Acme Corp"
  const customerEmail = invoice.customer?.email || invoice.customerEmail || "acme@company.com"
  const customerPhone = invoice.customer?.phone || "+1 555 010 1234"
  const customerAddress = invoice.customer?.address
    ? `${invoice.customer.address.street || ""}, ${invoice.customer.address.city || ""}, ${invoice.customer.address.country || ""}`
    : "123 Business Park Drive, San Francisco, CA 94107, United States"

  const subNumber = invoice.subscription?.subscriptionNumber || invoice.subscriptionNumber || "SUB-0012"
  const planName = invoice.subscription?.plan?.name || invoice.planName || "Business Plan"
  const status = (invoice.status || "Draft").toLowerCase()

  const issueDate = invoice.invoiceDate || invoice.createdAt || "2026-10-01"
  const dueDate = invoice.dueDate || "2026-10-31"
  const totalAmount = invoice.totalAmount ?? invoice.total ?? 5000000
  const paidAmount = invoice.paidAmount ?? (status === "paid" ? totalAmount : 0)
  const outstanding = Math.max(0, totalAmount - paidAmount)

  const items = invoice.items || invoice.lines || [
    {
      _id: "1",
      productName: "Odoo ERP License",
      variantName: "Standard",
      quantity: 10,
      unitPrice: 400000,
      taxRate: 18,
      total: 4000000,
    },
    {
      _id: "2",
      productName: "Technical Support Service",
      variantName: "—",
      quantity: 1,
      unitPrice: 847500,
      taxRate: 18,
      total: 1000000,
    },
  ]

  const subtotal = invoice.subtotal ?? Math.round(totalAmount * 0.8475)
  const taxAmount = invoice.taxAmount ?? (totalAmount - subtotal)

  // Status badge style helper
  const getStatusBadge = (st) => {
    switch (st) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
      case "confirmed":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
      case "overdue":
        return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-900/50"
      case "cancelled":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      default:
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
    }
  }

  const handleActionSuccess = () => {
    dispatch(fetchInvoiceById(id))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to={`${basePath}/invoices`} className="hover:text-blue-600 transition flex items-center gap-1">
              <ArrowLeft className="size-3.5" />
              <span>Invoices</span>
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{invNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {invNumber}
                </h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${getStatusBadge(
                    status
                  )}`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{customerName}</span>
                {" · "}
                <span>{subNumber}</span>
                {" · "}
                <span>{planName}</span>
                {" · "}
                <span>Issued: {formatDate(issueDate)}</span>
                {" · "}
                <span>Due: {formatDate(dueDate)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setShowSendModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition border border-blue-200 dark:border-blue-900/50"
          >
            <Mail className="size-3.5" />
            <span>Send Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Printer className="size-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="size-3.5" />
            <span>Download PDF</span>
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <span>More</span>
              <MoreHorizontal className="size-3.5" />
            </button>

            {showMoreMenu && (
              <div
                onClick={() => setShowMoreMenu(false)}
                className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-30 text-xs"
              >
                {status === "draft" && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 flex items-center gap-2"
                  >
                    <Check className="size-3.5" />
                    <span>Confirm Invoice</span>
                  </button>
                )}
                {status !== "cancelled" && status !== "paid" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-red-600 flex items-center gap-2"
                  >
                    <Ban className="size-3.5" />
                    <span>Cancel Invoice</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <IndianRupee className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Amount
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Paid Amount
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(paidAmount)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Outstanding
            </div>
            <div
              className={`text-xl font-bold mt-0.5 ${
                outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatCurrency(outstanding)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-base font-bold text-slate-900 dark:text-white capitalize">
                {status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-medium">
        {[
          { key: "overview", label: "Overview" },
          { key: "items", label: `Items (${items.length})` },
          { key: "payments", label: "Payments" },
          { key: "activity", label: "Activity History" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 transition capitalize ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Invoice Info & Items */}
          <div className="lg:col-span-7 space-y-6">
            {/* Invoice Information Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                Invoice Information
              </h2>
              <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block">Invoice Number</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {invNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                    {customerName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Subscription</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                    {subNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Plan</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {planName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Invoice Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(issueDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Due Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(dueDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Billing Interval</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {invoice.subscription?.billingInterval || "Monthly"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Terms</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {invoice.paymentTerms || "Net 30"}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Items Table Preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                Invoice Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="pb-2.5">#</th>
                      <th className="pb-2.5">Product</th>
                      <th className="pb-2.5">Variant</th>
                      <th className="pb-2.5 text-right">Quantity</th>
                      <th className="pb-2.5 text-right">Unit Price</th>
                      <th className="pb-2.5 text-right">Tax</th>
                      <th className="pb-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {items.map((item, idx) => (
                      <tr key={item._id || idx}>
                        <td className="py-3 text-slate-400">{idx + 1}</td>
                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                          {item.productName || item.product?.name || item.name || "Item"}
                        </td>
                        <td className="py-3 text-slate-500">
                          {item.variantName || item.variant?.name || "—"}
                        </td>
                        <td className="py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                          {item.quantity || 1}
                        </td>
                        <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                          {formatCurrency(item.unitPrice || 0)}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {item.taxRate ? `${item.taxRate}%` : "18%"}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(item.total || (item.quantity || 1) * (item.unitPrice || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Customer Info, Timeline, Pricing Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Customer Information Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Customer Information
                </h2>
                <Link
                  to={`${basePath}/customers`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>View Customer</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-xs shrink-0">
                  {customerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1.5 text-xs min-w-0">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {customerName}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="size-3.5 shrink-0" />
                    <span>{customerPhone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-500 pt-1">
                    <MapPin className="size-3.5 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{customerAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pricing Summary
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax (18%)</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Discount</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">—</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                Timeline
              </h2>
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                <div className="relative">
                  <div className="size-4 rounded-full bg-emerald-500 absolute -left-6 top-0.5 ring-4 ring-white dark:ring-slate-900" />
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Invoice marked as Paid
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(dueDate)} · Payment of {formatCurrency(totalAmount)} received
                  </div>
                </div>

                <div className="relative">
                  <div className="size-4 rounded-full bg-blue-500 absolute -left-6 top-0.5 ring-4 ring-white dark:ring-slate-900" />
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Invoice sent to customer
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(issueDate)} · Invoice email delivered to {customerEmail}
                  </div>
                </div>

                <div className="relative">
                  <div className="size-4 rounded-full bg-blue-400 absolute -left-6 top-0.5 ring-4 ring-white dark:ring-slate-900" />
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Invoice confirmed
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(issueDate)} · Marked as confirmed by Staff User
                  </div>
                </div>

                <div className="relative">
                  <div className="size-4 rounded-full bg-slate-400 absolute -left-6 top-0.5 ring-4 ring-white dark:ring-slate-900" />
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Invoice created
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(issueDate)} · Generated from subscription {subNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ITEMS ─────────────────────────────────────────────────── */}
      {activeTab === "items" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="py-3">#</th>
                  <th className="py-3">Product Name</th>
                  <th className="py-3">Variant</th>
                  <th className="py-3 text-right">Quantity</th>
                  <th className="py-3 text-right">Unit Price</th>
                  <th className="py-3 text-right">Tax Rate</th>
                  <th className="py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td className="py-3.5 text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 font-semibold text-slate-900 dark:text-white">
                      {item.productName || item.product?.name || item.name || "Item"}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {item.variantName || item.variant?.name || "—"}
                    </td>
                    <td className="py-3.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {item.quantity || 1}
                    </td>
                    <td className="py-3.5 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="py-3.5 text-right text-slate-500">
                      {item.taxRate ? `${item.taxRate}%` : "18%"}
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.total || (item.quantity || 1) * (item.unitPrice || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: PAYMENTS ──────────────────────────────────────────────── */}
      {activeTab === "payments" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="py-3">Payment ID</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Method</th>
                  <th className="py-3 text-right">Amount</th>
                  <th className="py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td className="py-3.5 font-medium text-blue-600 dark:text-blue-400">
                    PAY-{(invoice._id || invoice.id || "1").slice(-6).toUpperCase()}
                  </td>
                  <td className="py-3.5 text-slate-500">{formatDate(issueDate)}</td>
                  <td className="py-3.5 text-slate-700 dark:text-slate-300">Bank Transfer / UPI</td>
                  <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(paidAmount)}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      Success
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: ACTIVITY HISTORY ──────────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Audit Trail</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Payment Received
                </span>
                <span className="text-slate-400 ml-2">₹ {formatCurrency(paidAmount)} paid via online portal</span>
              </div>
              <span className="text-slate-400">{formatDate(dueDate)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Invoice Sent</span>
                <span className="text-slate-400 ml-2">Delivered to {customerEmail}</span>
              </div>
              <span className="text-slate-400">{formatDate(issueDate)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Invoice Created</span>
                <span className="text-slate-400 ml-2">Generated for {subNumber}</span>
              </div>
              <span className="text-slate-400">{formatDate(issueDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <InvoiceActionModals
        invoiceId={invoice._id || invoice.id}
        invoiceNumber={invNumber}
        customerEmail={customerEmail}
        showConfirm={showConfirmModal}
        onCloseConfirm={() => setShowConfirmModal(false)}
        showCancel={showCancelModal}
        onCloseCancel={() => setShowCancelModal(false)}
        showSend={showSendModal}
        onCloseSend={() => setShowSendModal(false)}
        showDownload={showDownloadModal}
        onCloseDownload={() => setShowDownloadModal(false)}
        showPrint={showPrintModal}
        onClosePrint={() => setShowPrintModal(false)}
        onActionSuccess={handleActionSuccess}
      />
    </div>
  )
}

