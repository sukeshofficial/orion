// src/components/payments/RecordPaymentDialog.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { recordPayment, fetchPayments, fetchPaymentStats } from "@/redux/Slices/paymentSlice"
import { fetchInvoices } from "@/redux/Slices/invoiceSlice"
import { formatCurrency } from "@/lib/formatters"
import {
  X,
  CreditCard,
  Building,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react"

export default function RecordPaymentDialog({
  isOpen,
  onClose,
  preselectedInvoiceId = null,
  onSuccess,
}) {
  const dispatch = useDispatch()
  const { invoices } = useSelector((state) => state.invoice)
  const { actionLoading } = useSelector((state) => state.payment)

  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState(preselectedInvoiceId || "")
  const [method, setMethod] = React.useState("Bank Transfer")
  const [amount, setAmount] = React.useState("")
  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().split("T")[0]
  )
  const [notes, setNotes] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      dispatch(fetchInvoices({ limit: 100 }))
    }
  }, [dispatch, isOpen])

  // Available invoices eligible for payment
  const eligibleInvoices = React.useMemo(() => {
    return (invoices || []).filter((inv) => {
      const status = (inv.status || "").toLowerCase()
      return status !== "cancelled"
    })
  }, [invoices])

  // Select initial invoice if none selected
  React.useEffect(() => {
    if (preselectedInvoiceId) {
      setSelectedInvoiceId(preselectedInvoiceId)
    } else if (eligibleInvoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(eligibleInvoices[0]._id || eligibleInvoices[0].id)
    }
  }, [preselectedInvoiceId, eligibleInvoices, selectedInvoiceId])

  // Active invoice details
  const activeInvoice = React.useMemo(() => {
    return eligibleInvoices.find(
      (inv) => (inv._id || inv.id) === selectedInvoiceId
    ) || null
  }, [eligibleInvoices, selectedInvoiceId])

  const totalAmount = activeInvoice?.totalAmount ?? activeInvoice?.total ?? 10000000
  const paidAmount = activeInvoice?.paidAmount ?? 5000000
  const outstandingAmount = Math.max(0, totalAmount - paidAmount)

  // Auto set amount to outstanding on invoice change
  React.useEffect(() => {
    if (outstandingAmount > 0) {
      setAmount((outstandingAmount / 100).toString())
    } else {
      setAmount("0")
    }
  }, [outstandingAmount, selectedInvoiceId])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    const numAmount = Number(amount) * 100 // Convert to minor units (cents/paise)
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount.")
      return
    }

    if (numAmount > outstandingAmount && outstandingAmount > 0) {
      setErrorMsg(`Payment amount cannot exceed outstanding balance of ${formatCurrency(outstandingAmount)}.`)
      return
    }

    const payload = {
      invoiceId: selectedInvoiceId,
      invoiceNumber: activeInvoice?.invoiceNumber || activeInvoice?.number || "INV-2026-001",
      customer: activeInvoice?.customer || { name: activeInvoice?.customerName || "Customer" },
      customerName: activeInvoice?.customer?.name || activeInvoice?.customerName || "Customer",
      amount: numAmount,
      method,
      paymentDate,
      notes,
    }

    const res = await dispatch(recordPayment(payload))
    if (!res.error) {
      dispatch(fetchPayments({}))
      dispatch(fetchPaymentStats())
      if (onSuccess) onSuccess(res.payload)
      onClose()
    } else {
      setErrorMsg(typeof res.payload === "string" ? res.payload : "Failed to record payment.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record a new payment for an existing invoice.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Select Invoice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Invoice *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {eligibleInvoices.map((inv) => {
                const id = inv._id || inv.id
                const invNum = inv.invoiceNumber || inv.number || `INV-${id.slice(-4)}`
                const cust = inv.customer?.name || inv.customerName || "Customer"
                const outBal = Math.max(0, (inv.totalAmount || inv.total || 0) - (inv.paidAmount || 0))
                return (
                  <option key={id} value={id}>
                    {invNum} — {cust} (Outstanding: {formatCurrency(outBal)})
                  </option>
                )
              })}
            </select>
          </div>

          {/* 3 Metric Summary Boxes */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Invoice Total
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Already Paid
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {formatCurrency(paidAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Outstanding
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5 block">
                {formatCurrency(outstandingAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Maximum amount: {formatCurrency(outstandingAmount)}
              </p>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Date *
            </label>
            <div className="relative">
              <Calendar className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="First payment for this invoice"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              {actionLoading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

