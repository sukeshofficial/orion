// src/pages/portal/MyPayments.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { fetchPayments } from "@/redux/Slices/paymentSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  CreditCard,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Receipt,
} from "lucide-react"

export default function MyPayments() {
  const dispatch = useDispatch()
  const { payments, loading } = useSelector((state) => state.payment)

  React.useEffect(() => {
    dispatch(fetchPayments({ limit: 50 }))
  }, [dispatch])

  const myPayments = payments || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Payments
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your payment history and receipts.
        </p>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="size-8 animate-spin mb-2 text-blue-600" />
            <span className="text-xs">Loading payments...</span>
          </div>
        ) : myPayments.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No payments found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {myPayments.map((pay, idx) => {
                  const pId = pay._id || pay.id
                  const invNum = pay.invoice?.invoiceNumber || pay.invoiceNumber || (pay.invoice?._id ? `INV-${pay.invoice._id.slice(-6).toUpperCase()}` : "—")
                  const invId = pay.invoice?._id || pay.invoice?.id || pay.invoiceId || invNum
                  const paymentMethod = pay.paymentMethod || pay.method || "Bank Transfer"

                  return (
                    <tr key={pId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {pay.paymentReference || (pId ? `PAY-${pId.slice(-6).toUpperCase()}` : "—")}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/portal/invoices/${invId}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {invNum}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {pay.paymentDate ? formatDate(pay.paymentDate) : (pay.createdAt ? formatDate(pay.createdAt) : "—")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(pay.amount || 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>Showing 1 to {myPayments.length} of 4 payments</div>
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

