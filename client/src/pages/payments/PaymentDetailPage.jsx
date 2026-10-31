// src/pages/payments/PaymentDetailPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import { fetchPaymentById } from "@/redux/Slices/paymentSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ArrowLeft,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  FileText,
  IndianRupee,
  Loader2,
  Receipt,
  User,
} from "lucide-react"

export default function PaymentDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedPayment: payment, detailLoading: loading, error } = useSelector(
    (state) => state.payment
  )

  const [showMoreMenu, setShowMoreMenu] = React.useState(false)

  React.useEffect(() => {
    if (id) {
      dispatch(fetchPaymentById(id))
    }
  }, [dispatch, id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="size-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Loading payment details...</p>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Receipt className="size-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          {typeof error === "string" ? error : "The requested payment could not be located."}
        </p>
        <Link
          to={`${basePath}/payments`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <ArrowLeft className="size-4" />
          Back to Payments
        </Link>
      </div>
    )
  }

  const payRef = payment.paymentReference || "PAY-2026-0012"
  const custName = payment.customer?.name || payment.customerName || "Acme Corp"
  const custEmail = payment.customer?.email || "acme@company.com"
  const custPhone = payment.customer?.phone || "+1 555 010 1234"
  const custCompany = payment.customer?.company || "Acme Corporation"
  const custAddress = "123 Business Park Drive, San Francisco, CA 94107, United States"

  const invNum = payment.invoice?.invoiceNumber || payment.invoiceNumber || "INV-2026-001"
  const invId = payment.invoice?.id || payment.invoice?._id || invNum

  const payAmount = payment.amount || 5000000
  const invTotal = payment.invoice?.total || 10000000
  const alreadyPaid = payment.invoice?.paidAmount || 5000000
  const outstanding = Math.max(0, invTotal - alreadyPaid)

  const paymentDate = payment.paymentDate || "2026-10-20T14:30:00.000Z"
  const createdDate = payment.createdAt || paymentDate

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to={`${basePath}/payments`} className="hover:text-blue-600 transition flex items-center gap-1">
              <ArrowLeft className="size-3.5" />
              <span>Payments</span>
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{payRef}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CreditCard className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {payRef}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                  Completed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{custName}</span>
                {" · "}
                <span>{invNum}</span>
                {" · "}
                <span>{formatDate(paymentDate)} · 02:30 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-center">
          <Link
            to={`${basePath}/invoices/${invId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <span>View Invoice</span>
            <ExternalLink className="size-3.5" />
          </Link>

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
                className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-30 text-xs"
              >
                <button
                  onClick={() => window.print()}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Print Receipt
                </button>
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
              Payment Amount
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(payAmount)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Invoice Total
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(invTotal)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Already Paid
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(alreadyPaid)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Outstanding
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              {formatCurrency(outstanding)}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Column Information Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Payment Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Payment Information
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Payment Reference</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {payRef}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Amount Received</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(payAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Payment Method</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {payment.method || "Bank Transfer"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Payment Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatDate(paymentDate)}, 02:30 PM
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Notes</span>
              <span className="text-slate-700 dark:text-slate-300">
                {payment.notes || "First payment"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Status</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                Completed
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Created By</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {payment.createdBy || "Admin User"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Created At</span>
              <span className="text-slate-500">
                {formatDate(createdDate)}, 02:32 PM
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Invoice Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Invoice Information
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Invoice Number</span>
              <Link
                to={`${basePath}/invoices/${invId}`}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                {invNum}
              </Link>
            </div>
            <div>
              <span className="text-slate-400 block">Customer</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {custName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Subscription</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {payment.invoice?.subscriptionNumber || "SUB-0012"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Plan</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {payment.invoice?.planName || "Business Plan"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Invoice Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Oct 01, 2026
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Due Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Oct 31, 2026
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Amount</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(invTotal)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Paid Amount</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(alreadyPaid)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Outstanding Amount</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(outstanding)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 mt-0.5">
                Partially Paid
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Customer Information & Payment Timeline */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </h2>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Name</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {custName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {custEmail}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {custPhone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Company</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {custCompany}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Billing Address</span>
                <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {custAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Payment Timeline
            </h2>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              <div className="relative">
                <div className="size-3.5 rounded-full bg-emerald-500 absolute -left-6 top-0.5 ring-4 ring-white dark:ring-slate-900" />
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Payment recorded
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Oct 20, 2026, 02:30 PM · {formatCurrency(payAmount)} via {payment.method || "Bank Transfer"}
                </div>
              </div>

              <div className="relative">
                <div className="size-3.5 rounded-full bg-blue-500 absolute -left-6 top-0.5 ring-4 ring-white dark:ring-slate-900" />
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Invoice created
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Oct 01, 2026, 10:15 AM · Total {formatCurrency(invTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

