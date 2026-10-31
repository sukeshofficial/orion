// src/pages/portal/CustomerDashboard.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { fetchPortalOverview } from "@/redux/Slices/customerPortalSlice"
import { fetchSubscriptions } from "@/redux/Slices/subscriptionSlice"
import { fetchInvoices } from "@/redux/Slices/invoiceSlice"
import { fetchPayments } from "@/redux/Slices/paymentSlice"
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
  TrendingUp,
  BarChart2,
  PieChart,
  IndianRupee,
} from "lucide-react"

export default function CustomerDashboard() {
  const dispatch = useDispatch()
  const { overview } = useSelector((state) => state.portal)
  const { subscriptions } = useSelector((state) => state.subscription)
  const { invoices } = useSelector((state) => state.invoice)
  const { payments } = useSelector((state) => state.payment)

  const [period, setPeriod] = React.useState("Monthly")

  React.useEffect(() => {
    dispatch(fetchPortalOverview())
    dispatch(fetchSubscriptions({ limit: 5 }))
    dispatch(fetchInvoices({ limit: 5 }))
    dispatch(fetchPayments({ limit: 5 }))
  }, [dispatch])

  const mySubs = (subscriptions || []).slice(0, 3)
  const myInvs = (invoices || []).slice(0, 3)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/10 border border-blue-100 dark:border-blue-900/30">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>Welcome back, Acme</span>
          <span>👋</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Here's a quick overview of your account.
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
              {overview?.activeSubscriptions ?? 2}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              +1 from last month
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
              {overview?.upcomingRenewals ?? 1}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Next on Nov 01, 2026
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
              {formatCurrency(overview?.outstandingInvoices ?? 6000000)}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              2 invoices pending
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
              {formatCurrency(overview?.recentPayments ?? 12000000)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Last payment on Oct 20, 2026
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
                  5
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
              <span className="font-semibold text-slate-900 dark:text-white">2 (40%)</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-amber-500" />
                Paused
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">1 (20%)</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-red-500" />
                Closed
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">1 (20%)</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-cyan-500" />
                Expiring Soon
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">1 (20%)</span>
            </div>
          </div>
        </div>

        {/* Invoice Overview Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Invoice Overview
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
              {["Daily", "Monthly", "Quarterly", "Yearly"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    period === p
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-44 mt-6 flex items-end justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 relative">
            {[
              { m: "Jan", h: "35%" },
              { m: "Feb", h: "45%" },
              { m: "Mar", h: "55%" },
              { m: "Apr", h: "60%" },
              { m: "May", h: "75%" },
              { m: "Jun", h: "90%", hl: true },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                {bar.hl && (
                  <span className="text-[10px] font-bold text-blue-600 mb-1">₹ 2,48,000</span>
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
            <span>₹ 0</span>
            <span>₹ 1,00,000</span>
            <span>₹ 2,00,000</span>
            <span>₹ 3,00,000</span>
            <span>₹ 4,00,000</span>
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
            {[
              { ref: "PAY-2026-001", amt: "₹ 50,000", date: "Oct 20, 2026" },
              { ref: "PAY-2026-0005", amt: "₹ 25,000", date: "Oct 12, 2026" },
              { ref: "PAY-2026-0004", amt: "₹ 40,000", date: "Oct 05, 2026" },
              { ref: "PAY-2026-0003", amt: "₹ 15,000", date: "Sep 20, 2026" },
            ].map((pay, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                      {pay.ref}
                    </span>
                    <span className="text-[10px] text-slate-400">{pay.date}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  + {pay.amt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3 Bottom Tables ──────────────────────────────────────────────── */}
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
              {[
                { plan: "Business Plan", start: "Oct 01, 2026", exp: "Oct 01, 2027", st: "Active" },
                { plan: "Enterprise Plan", start: "Sep 15, 2026", exp: "Sep 15, 2027", st: "Active" },
                { plan: "Starter Plan", start: "Aug 10, 2026", exp: "Aug 10, 2027", st: "Paused" },
              ].map((sub, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {sub.plan}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{sub.start}</td>
                  <td className="py-2.5 px-3 text-slate-500">{sub.exp}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        sub.st === "Active" ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${sub.st === "Active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {sub.st}
                    </span>
                  </td>
                </tr>
              ))}
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
              {[
                { no: "INV-2026-003", due: "Nov 05, 2026", amt: "₹ 25,000", st: "Paid", color: "emerald" },
                { no: "INV-2026-002", due: "Oct 15, 2026", amt: "₹ 1,20,000", st: "Overdue", color: "red" },
                { no: "INV-2026-001", due: "Oct 31, 2026", amt: "₹ 50,000", st: "Confirmed", color: "blue" },
              ].map((inv, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {inv.no}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{inv.due}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{inv.amt}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inv.color === "emerald"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.color === "red"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {inv.st}
                    </span>
                  </td>
                </tr>
              ))}
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
              {[
                { no: "INV-2026-002", due: "Oct 15, 2026", out: "₹ 60,000" },
                { no: "INV-2026-009", due: "Sep 28, 2026", out: "₹ 25,000" },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {row.no}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{row.due}</td>
                  <td className="py-2.5 px-3 font-bold text-red-600 dark:text-red-400">
                    {row.out}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

