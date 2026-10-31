// src/components/invoices/GenerateInvoiceModal.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchSubscriptions } from "@/redux/Slices/subscriptionSlice"
import { generateInvoice } from "@/redux/Slices/invoiceSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  X,
  Search,
  CheckCircle2,
  ChevronRight,
  FileText,
  User,
  Calendar,
  CreditCard,
  Loader2,
} from "lucide-react"

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ currentStep }) {
  const steps = [
    { label: "Select Subscription", step: 1 },
    { label: "Review Details", step: 2 },
    { label: "Confirm & Generate", step: 3 },
  ]

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = currentStep > s.step
        const active = currentStep === s.step
        return (
          <React.Fragment key={s.step}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                  done
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : active
                    ? "border-[#2563EB] text-[#2563EB] bg-white dark:bg-card"
                    : "border-border text-muted-foreground bg-background"
                }`}
              >
                {done ? <CheckCircle2 className="size-4" /> : s.step}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center leading-tight ${
                  active ? "text-[#2563EB]" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 rounded-full mt-[-14px] transition-all ${
                  currentStep > s.step ? "bg-[#2563EB]" : "bg-border"
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 1 – Select Subscription ────────────────────────────────────────────

function Step1({ selectedId, onSelect }) {
  const dispatch = useDispatch()
  const { subscriptions, loading } = useSelector((s) => s.subscription)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    dispatch(fetchSubscriptions({ status: "Active", limit: 50 }))
  }, [dispatch])

  const filtered = React.useMemo(() => {
    if (!query) return subscriptions || []
    const q = query.toLowerCase()
    return (subscriptions || []).filter(
      (sub) =>
        (sub.subscriptionNumber || "").toLowerCase().includes(q) ||
        (sub.planId?.name || sub.planName || "").toLowerCase().includes(q) ||
        (sub.customerId?.companyName || sub.customerId?.userId?.name || "").toLowerCase().includes(q)
    )
  }, [subscriptions, query])

  const selected = (subscriptions || []).find(
    (s) => (s.id || s._id) === selectedId
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left – List */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Select Subscription</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose an active subscription to generate an invoice.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by subscription number or plan..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="size-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No active subscriptions found.
            </div>
          ) : (
            filtered.map((sub) => {
              const id = sub.id || sub._id
              const customerName =
                sub.customerId?.companyName ||
                sub.customerId?.userId?.name ||
                "Customer"
              const planName = sub.planId?.name || sub.planName || "Plan"
              const interval = sub.billingInterval || "monthly"
              const isSelected = id === selectedId
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                      : "border-border/70 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                        isSelected ? "border-[#2563EB]" : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <div className="size-2 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs font-mono text-foreground">
                          {sub.subscriptionNumber || id}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          — {customerName}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {planName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {interval.charAt(0).toUpperCase() + interval.slice(1)} •{" "}
                        Next: {formatDate(sub.nextBillingDate || sub.expiryDate)}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right – Details */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Subscription Details</h3>
        {!selected ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground h-full flex flex-col items-center justify-center gap-2">
            <FileText className="size-8 opacity-30" />
            <span>Select a subscription to see its details.</span>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-3.5">
            {[
              {
                label: "Subscription No.",
                value: selected.subscriptionNumber,
              },
              {
                label: "Customer",
                value:
                  selected.customerId?.companyName ||
                  selected.customerId?.userId?.name ||
                  "—",
              },
              {
                label: "Plan",
                value: selected.planId?.name || selected.planName || "—",
              },
              { label: "Start Date", value: formatDate(selected.startDate) },
              { label: "Current Expiry", value: formatDate(selected.expiryDate) },
              {
                label: "Billing Interval",
                value:
                  selected.billingInterval
                    ? selected.billingInterval.charAt(0).toUpperCase() +
                      selected.billingInterval.slice(1)
                    : "—",
              },
              {
                label: "Next Billing Date",
                value: formatDate(
                  selected.nextBillingDate || selected.expiryDate
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-muted-foreground shrink-0">{label}</span>
                <span className="font-medium text-foreground text-right">{value || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 2 – Review Details ─────────────────────────────────────────────────

function Step2({ subscription }) {
  if (!subscription) return null

  const customerName =
    subscription.customerId?.companyName ||
    subscription.customerId?.userId?.name ||
    "Customer"
  const email =
    subscription.customerId?.userId?.email ||
    subscription.customerEmail ||
    "—"
  const planName = subscription.planId?.name || subscription.planName || "Plan"
  const items = subscription.planId?.items || subscription.items || []
  const baseAmount = subscription.planId?.basePrice || subscription.totalAmount || 0
  const taxRate = subscription.planId?.taxRate ?? 18
  const discount = subscription.discount ?? 0
  const subtotal = baseAmount
  const taxAmt = Math.round(subtotal * (taxRate / 100))
  const total = subtotal + taxAmt - discount

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">Review Invoice Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verify the details before generating the invoice.
        </p>
      </div>

      {/* Customer Info */}
      <div className="rounded-xl border border-border/80 p-5">
        <div className="flex items-center gap-2 mb-3">
          <User className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Customer Information</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">{customerName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">{email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-medium text-foreground">{planName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Billing Interval</p>
            <p className="font-medium text-foreground capitalize">
              {subscription.billingInterval || "Monthly"}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      {items.length > 0 && (
        <div className="rounded-xl border border-border/80 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Invoice Items</h4>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-2.5 text-left">Product</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Unit Price</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-foreground">{item.productId?.name || item.name || `Item ${i + 1}`}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity ?? 1}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatCurrency(item.unitPrice ?? item.price ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {formatCurrency((item.quantity ?? 1) * (item.unitPrice ?? item.price ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="rounded-xl border border-border/80 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Pricing Summary</h4>
        </div>
        <div className="space-y-2.5 text-sm">
          {[
            { label: "Subtotal", value: formatCurrency(subtotal) },
            { label: `Tax (GST ${taxRate}%)`, value: formatCurrency(taxAmt) },
            { label: "Discount", value: `-${formatCurrency(discount)}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-muted-foreground">
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <div className="border-t border-border/60 pt-3 flex items-center justify-between font-bold text-base text-foreground">
            <span>Grand Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 – Confirm & Generate ─────────────────────────────────────────────

function Step3({ subscription }) {
  if (!subscription) return null

  const customerName =
    subscription.customerId?.companyName ||
    subscription.customerId?.userId?.name ||
    "Customer"
  const planName = subscription.planId?.name || subscription.planName || "Plan"
  const baseAmount = subscription.planId?.basePrice || subscription.totalAmount || 0
  const taxRate = subscription.planId?.taxRate ?? 18
  const discount = subscription.discount ?? 0
  const subtotal = baseAmount
  const taxAmt = Math.round(subtotal * (taxRate / 100))
  const total = subtotal + taxAmt - discount

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">Confirm & Generate</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review the summary and confirm to generate the invoice.
        </p>
      </div>

      <div className="rounded-xl border border-border/80 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
          <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <FileText className="size-5 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Invoice Summary</p>
            <p className="text-xs text-muted-foreground">
              {subscription.subscriptionNumber} — {customerName}
            </p>
          </div>
        </div>

        {[
          { label: "Customer", value: customerName },
          { label: "Plan", value: planName },
          { label: "Subscription", value: subscription.subscriptionNumber },
          { label: "Billing Interval", value: (subscription.billingInterval || "monthly").charAt(0).toUpperCase() + (subscription.billingInterval || "monthly").slice(1) },
          { label: "Invoice Period", value: `${formatDate(subscription.startDate)} – ${formatDate(subscription.expiryDate)}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value || "—"}</span>
          </div>
        ))}

        <div className="border-t border-border/60 pt-4 flex items-center justify-between text-base font-bold text-foreground">
          <span>Total Amount</span>
          <span className="text-[#2563EB]">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-4 text-sm text-blue-700 dark:text-blue-300">
        By clicking <span className="font-semibold">Generate Invoice</span>, a new invoice will be created
        as a draft. You can review and confirm it from the Invoices page.
      </div>
    </div>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function GenerateInvoiceModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const { subscriptions } = useSelector((s) => s.subscription)
  const { actionLoading } = useSelector((s) => s.invoice)

  const [step, setStep] = React.useState(1)
  const [selectedId, setSelectedId] = React.useState(null)
  const [errorMsg, setErrorMsg] = React.useState("")

  const selectedSub = React.useMemo(
    () => (subscriptions || []).find((s) => (s.id || s._id) === selectedId),
    [subscriptions, selectedId]
  )

  function handleNext() {
    setErrorMsg("")
    if (step < 3) setStep((s) => s + 1)
  }

  function handleBack() {
    setErrorMsg("")
    if (step > 1) setStep((s) => s - 1)
  }

  async function handleGenerate() {
    if (!selectedId) return
    setErrorMsg("")
    const res = await dispatch(generateInvoice({ subscriptionId: selectedId }))
    if (!res.error) {
      if (onSuccess) onSuccess(res.payload)
      onClose()
    } else {
      setErrorMsg(
        typeof res.payload === "string"
          ? res.payload
          : res.error?.message || "Failed to generate invoice."
      )
    }
  }

  function handleClose() {
    setStep(1)
    setSelectedId(null)
    setErrorMsg("")
    onClose()
  }

  if (!isOpen) return null

  const canNext =
    (step === 1 && !!selectedId) ||
    step === 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <FileText className="size-5 text-[#2563EB]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Generate Invoice</h2>
              <p className="text-xs text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Stepper currentStep={step} />

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <Step1
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {step === 2 && <Step2 subscription={selectedSub} />}
          {step === 3 && <Step3 subscription={selectedSub} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
          <button
            type="button"
            onClick={step === 1 ? handleClose : handleBack}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              Next <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {actionLoading ? (
                <><Loader2 className="size-4 animate-spin" /> Generating...</>
              ) : (
                <><FileText className="size-4" /> Generate Invoice</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
