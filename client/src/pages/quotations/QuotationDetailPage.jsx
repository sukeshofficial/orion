// src/pages/quotations/QuotationDetailPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  fetchQuotationById,
  confirmQuotation,
  cancelQuotation,
  convertQuotation,
} from "@/redux/Slices/quotationSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ChevronLeft,
  FileText,
  User,
  Check,
  Ban,
  ArrowRightCircle,
  Pencil,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react"

export default function QuotationDetailPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedQuotation, detailLoading, actionLoading, error } = useSelector(
    (state) => state.quotation
  )

  React.useEffect(() => {
    if (id) {
      dispatch(fetchQuotationById(id))
    }
  }, [dispatch, id])

  function handleConfirm() {
    if (!id) return
    dispatch(confirmQuotation(id)).then(() => {
      dispatch(fetchQuotationById(id))
    })
  }

  function handleCancel() {
    if (!id) return
    const reason = prompt("Enter cancellation reason (optional):") || "Customer cancelled"
    dispatch(cancelQuotation({ id, reason })).then(() => {
      dispatch(fetchQuotationById(id))
    })
  }

  function handleConvert() {
    if (!id) return
    dispatch(convertQuotation(id)).then((res) => {
      if (!res.error) {
        alert("Quotation successfully converted to active subscription!")
        dispatch(fetchQuotationById(id))
      }
    })
  }

  if (detailLoading || !selectedQuotation) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs text-muted-foreground">Loading quotation details...</p>
      </div>
    )
  }

  const q = selectedQuotation
  const status = (q.status || "Draft").toLowerCase()
  const canEdit = status === "draft"
  const canConfirm = status === "draft" || status === "quotation"
  const canCancel = status !== "cancelled" && status !== "expired"
  const canConvert = status === "confirmed"

  const customerName =
    q.customerId?.companyName || q.customerId?.userId?.name || q.customerName || "Customer"
  const customerEmail = q.customerId?.userId?.email || "—"
  const customerPhone = q.customerId?.phone || "—"
  const customerTaxId = q.customerId?.taxIdentificationNumber || "N/A"
  const billingAddr = q.customerId?.billingAddress

  const planName = q.planId?.name || "Subscription Plan"

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Link
              to={`${basePath}/quotations`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Quotations
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium font-mono">
              {q.quotationNumber}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
              {q.quotationNumber}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                status === "confirmed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : status === "cancelled"
                  ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
                  : status === "quotation"
                  ? "bg-blue-50 text-[#2563EB] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                  : "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {q.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quotation for {customerName} · Linked Plan: {planName}
          </p>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`${basePath}/quotations/${id}/edit`)}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Pencil className="size-4" />
              Edit
            </button>
          )}

          {canConfirm && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              <Check className="size-4" />
              Confirm
            </button>
          )}

          {canConvert && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] transition cursor-pointer"
            >
              <ArrowRightCircle className="size-4" />
              Convert to Subscription
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
            >
              <Ban className="size-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="size-4 text-[#2563EB]" />
            Customer Information
          </h2>
          <div className="text-xs divide-y divide-border/60">
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Name / Company</span>
              <span className="font-semibold text-foreground">{customerName}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{customerEmail}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="text-foreground">{customerPhone}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Tax Identification</span>
              <span className="font-mono text-foreground">{customerTaxId}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="size-4 text-[#2563EB]" />
            Quotation Validity & Terms
          </h2>
          <div className="text-xs divide-y divide-border/60">
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Created Date</span>
              <span className="text-foreground">{formatDate(q.createdAt)}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Expiry Date</span>
              <span className="text-foreground">{formatDate(q.expiryDate)}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Payment Terms</span>
              <span className="font-semibold text-foreground capitalize">
                {(q.paymentTerms || "immediate").replace("_", " ")}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold text-foreground">{planName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Lines Table ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-foreground">Product Lines</h2>
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Tax</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {q.lines?.map((line, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {line.productName || "Product"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {line.variantName || "Standard"}
                  </td>
                  <td className="px-4 py-3 text-foreground">{line.quantity}</td>
                  <td className="px-4 py-3 text-foreground">
                    {formatCurrency(line.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatCurrency(line.taxAmount)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground text-right">
                    {formatCurrency(line.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-border/60 pt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrency(q.subtotal)}
              </span>
            </div>
            {q.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-medium">
                  -{formatCurrency(q.discountTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Taxes</span>
              <span className="font-medium text-foreground">
                {formatCurrency(q.taxTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border/60 pt-2 text-foreground">
              <span>Grand Total</span>
              <span className="text-[#2563EB] text-base">
                {formatCurrency(q.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity Timeline ── */}
      {Array.isArray(q.statusHistory) && q.statusHistory.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="size-4 text-[#2563EB]" />
            Activity Timeline
          </h2>
          <div className="space-y-4">
            {q.statusHistory.map((hist, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="size-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    Status changed to <span className="text-[#2563EB]">{hist.status}</span>
                  </p>
                  {hist.reason && (
                    <p className="text-muted-foreground mt-0.5">Reason: {hist.reason}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(hist.changedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

