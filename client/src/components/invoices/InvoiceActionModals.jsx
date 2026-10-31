// src/components/invoices/InvoiceActionModals.jsx
import * as React from "react"
import { useDispatch } from "react-redux"
import {
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
} from "@/redux/Slices/invoiceSlice"
import {
  Info,
  AlertTriangle,
  Send,
  Download,
  Printer,
  X,
  Loader2,
} from "lucide-react"

export default function InvoiceActionModals({
  invoiceId,
  invoiceNumber,
  customerEmail = "",
  showConfirm,
  onCloseConfirm,
  showCancel,
  onCloseCancel,
  showSend,
  onCloseSend,
  showDownload,
  onCloseDownload,
  showPrint,
  onClosePrint,
  onActionSuccess,
}) {
  const dispatch = useDispatch()
  const [recipientEmail, setRecipientEmail] = React.useState(customerEmail)
  const [cancelReason, setCancelReason] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (customerEmail) {
      setRecipientEmail(customerEmail)
    }
  }, [customerEmail])

  // Confirm Handler
  const handleConfirm = async () => {
    if (!invoiceId) return
    setSubmitting(true)
    try {
      const res = await dispatch(confirmInvoice(invoiceId))
      if (!res.error) {
        onCloseConfirm()
        if (onActionSuccess) onActionSuccess("confirmed")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Cancel Handler
  const handleCancel = async () => {
    if (!invoiceId) return
    setSubmitting(true)
    try {
      const res = await dispatch(cancelInvoice({ id: invoiceId, reason: cancelReason }))
      if (!res.error) {
        onCloseCancel()
        if (onActionSuccess) onActionSuccess("cancelled")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Send Handler
  const handleSend = async () => {
    if (!invoiceId) return
    setSubmitting(true)
    try {
      const res = await dispatch(
        sendInvoice({ invoiceId, email: recipientEmail || customerEmail })
      )
      if (!res.error) {
        onCloseSend()
        if (onActionSuccess) onActionSuccess("sent")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Download Handler
  const handleDownload = () => {
    window.print()
    onCloseDownload()
    if (onActionSuccess) onActionSuccess("downloaded")
  }

  // Print Handler
  const handlePrint = () => {
    window.print()
    onClosePrint()
    if (onActionSuccess) onActionSuccess("printed")
  }

  return (
    <>
      {/* 1. Confirm Invoice Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={onCloseConfirm}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Info className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Confirm Invoice
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to confirm this invoice? This will mark the invoice as confirmed and send it to the customer (if enabled).
                </p>
                {invoiceNumber && (
                  <div className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    Invoice: <span className="font-semibold">{invoiceNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCloseConfirm}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Confirm Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cancel Invoice Dialog */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={onCloseCancel}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div className="w-full">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Cancel Invoice
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to cancel this invoice? This action cannot be undone.
                </p>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cancellation Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer requested cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCloseCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 shadow-sm"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Cancel Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Send Invoice Dialog */}
      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={onCloseSend}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Send className="size-6" />
              </div>
              <div className="w-full">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Send Invoice
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Send this invoice to the customer via email. Invoice PDF will be attached.
                </p>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCloseSend}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={submitting || !recipientEmail}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Download Invoice Dialog */}
      {showDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={onCloseDownload}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Download className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Download Invoice
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Download the invoice PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCloseDownload}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Print Invoice Dialog */}
      {showPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={onClosePrint}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Printer className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Print Invoice
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Open the invoice PDF in a new tab for printing.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClosePrint}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

