// src/pages/portal/CustomerDashboard.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { fetchPortalOverview } from "@/redux/Slices/customerPortalSlice"
import { fetchSubscriptions } from "@/redux/Slices/subscriptionSlice"
import { fetchInvoices } from "@/redux/Slices/invoiceSlice"
import { fetchPayments } from "@/redux/Slices/paymentSlice"
import { useAuth } from "@/context/AuthContext"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  Boxes,
  RefreshCw,
  Clock,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ArrowRight,
  PieChart,
  IndianRupee,
} from "lucide-react"

export default function CustomerDashboard() {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { overview } = useSelector((state) => state.portal)
  const { subscriptions } = useSelector((state) => state.subscription)
  const { invoices } = useSelector((state) => state.invoice)
  const { payments } = useSelector((state) => state.payment)

  const [period, setPeriod] = React.useState("Monthly")

  React.useEffect(() => {
    dispatch(fetchPortalOverview())
    dispatch(fetchSubscriptions({ limit: 10 }))
    dispatch(fetchInvoices({ limit: 10 }))
    dispatch(fetchPayments({ limit: 10 }))
  }, [dispatch])

  const mySubs = subscriptions || []
  const myInvs = invoices || []
  const myPays = payments || []

  // Dynamic subscription status counts
  const totalSubs = mySubs.length
  const activeSubs = mySubs.filter((s) => (s.status || "").toLowerCase() === "active").length
  const pausedSubs = mySubs.filter((s) => (s.status || "").toLowerCase() === "paused").length
  const closedSubs = mySubs.filter((s) => (s.status || "").toLowerCase() === "closed").length
  const draftSubs = mySubs.filter(
    (s) =>
      (s.status || "").toLowerCase() === "draft" ||
      (s.status || "").toLowerCase() === "quotation"
  ).length

  // Dynamic overdue invoices
  const now = new Date()
  const overdueInvs = myInvs.filter((inv) => {
    const st = (inv.status || "").toLowerCase()
    const isPastDue = inv.dueDate && new Date(inv.dueDate) < now
    const hasBalance = (inv.amountDue ?? inv.outstandingAmount ?? 0) > 0
    return st === "overdue" || (isPastDue && hasBalance && st !== "paid" && st !== "cancelled")
  })

  // Dynamic invoice bars
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthlyInvoices = React.useMemo(() => {
    const buckets = {}
    myInvs.forEach((inv) => {
      const d = inv.issueDate || inv.invoiceDate || inv.createdAt
      if (!d) return
      const dateObj = new Date(d)
      const m = monthNames[dateObj.getMonth()]
      buckets[m] = (buckets[m] || 0) + (inv.totalAmount || inv.total || 0)
    })
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const m = monthNames[d.getMonth()]
      last6Months.push({ m, val: buckets[m] || 0 })
    }
    const maxVal = Math.max(...last6Months.map((b) => b.val), 1)
    return last6Months.map((b) => ({
      m: b.m,
      val: b.val,
      h: b.val > 0 ? `${Math.max(Math.round((b.val / maxVal) * 100), 10)}%` : "4px",
      hl: b.val === maxVal && b.val > 0,
    }))
  }, [myInvs])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/10 border border-blue-100 dark:border-blue-900/30">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>Welcome back, {user?.name || user?.companyName || "there"}</span>
          <span>👋</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Here's a quick overview of your account and subscriptions.
        </p>
      </div>

      {/* ── 4 Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Boxes className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Subscriptions
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview?.activeSubscriptions ?? activeSubs}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Live & active
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <RefreshCw className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Upcoming Renewals
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview?.upcomingRenewals ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {overview?.upcomingRenewalsDate
                ? `Next: ${formatDate(overview.upcomingRenewalsDate)}`
                : "Next 30 days"}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <IndianRupee className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Outstanding Invoices
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(overview?.outstandingInvoices ?? 0)}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              {overview?.outstandingCount ?? 0} invoices pending
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Recent Payments
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(overview?.recentPayments ?? 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {overview?.lastPaymentDate
                ? `Last: ${formatDate(overview.lastPaymentDate)}`
                : "Total settled"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Visual Middle Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subscription Status Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Subscription Status
            </h3>
            <PieChart className="size-4 text-slate-400" />
          </div>

          <div className="flex items-center justify-center my-6">
            <div className="size-32 rounded-full border-[10px] border-emerald-500 border-t-amber-500 border-r-red-500 border-l-cyan-500 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-white block leading-none">
                  {totalSubs}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Total</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-emerald-500" />
                Active
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {activeSubs} ({totalSubs ? Math.round((activeSubs / totalSubs) * 100) : 0}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-amber-500" />
                Paused
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {pausedSubs} ({totalSubs ? Math.round((pausedSubs / totalSubs) * 100) : 0}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-red-500" />
                Closed
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {closedSubs} ({totalSubs ? Math.round((closedSubs / totalSubs) * 100) : 0}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-cyan-500" />
                Draft / Quotation
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {draftSubs} ({totalSubs ? Math.round((draftSubs / totalSubs) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Overview Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Invoice Overview
            </h3>
            <span className="text-[11px] text-slate-400">Billed Volume</span>
          </div>

          <div className="h-44 mt-6 flex items-end justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 relative">
            {monthlyInvoices.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                {bar.hl && bar.val > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 mb-1">{formatCurrency(bar.val)}</span>
                )}
                <div
                  style={{ height: bar.h }}
                  className={`w-full max-w-[20px] rounded-t transition ${
                    bar.hl ? "bg-blue-600" : "bg-blue-200 dark:bg-blue-900/50"
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-2 font-medium">{bar.m}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-3">
            <span>Recent 6 Months</span>
            <span>Total Invoices: {myInvs.length}</span>
          </div>
        </div>

        {/* Recent Payments Feed */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Payments</h3>
            <Link to="/portal/payments" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {myPays.length > 0 ? (
              myPays.slice(0, 4).map((pay) => (
                <div key={pay._id || pay.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {pay.paymentReference || pay.reference || "PAY"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(pay.paymentDate || pay.createdAt)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    +{formatCurrency(pay.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">
                No payments recorded yet
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Link
              to="/portal/payments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All payments <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3 Bottom Data Tables ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table 1: Recent Subscriptions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Recent Subscriptions
            </h3>
            <Link to="/portal/subscriptions" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {mySubs.length > 0 ? (
                mySubs.slice(0, 4).map((sub) => {
                  const planName = sub.planSnapshot?.name || sub.planName || sub.planId?.name || "Subscription"
                  const st = sub.status || "Active"
                  return (
                    <tr key={sub._id || sub.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        <Link to={`/portal/subscriptions/${sub._id || sub.id}`} className="hover:underline">
                          {planName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(sub.startDate)}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(sub.expiryDate)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            st.toLowerCase() === "active" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              st.toLowerCase() === "active" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {st}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No subscriptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table 2: Recent Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Recent Invoices
            </h3>
            <Link to="/portal/invoices" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {myInvs.length > 0 ? (
                myInvs.slice(0, 4).map((inv) => {
                  const st = inv.status || "Draft"
                  return (
                    <tr key={inv._id || inv.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        <Link to={`/portal/invoices/${inv._id || inv.id}`} className="hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {formatCurrency(inv.totalAmount || inv.total || 0)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            st.toLowerCase() === "paid"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : st.toLowerCase() === "overdue"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table 3: Overdue Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Overdue Invoices
            </h3>
            <Link to="/portal/invoices" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {overdueInvs.length > 0 ? (
                overdueInvs.slice(0, 4).map((row) => (
                  <tr key={row._id || row.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      <Link to={`/portal/invoices/${row._id || row.id}`} className="hover:underline">
                        {row.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{formatDate(row.dueDate)}</td>
                    <td className="py-2.5 px-3 font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(row.amountDue ?? row.outstandingAmount ?? 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    No overdue invoices
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
