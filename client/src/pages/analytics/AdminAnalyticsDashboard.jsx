// src/pages/analytics/AdminAnalyticsDashboard.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useLocation } from "react-router-dom"
import {
  fetchAnalyticsOverview,
  fetchRevenueAnalytics,
  fetchSubscriptionAnalytics,
  fetchInvoiceAnalytics,
  setAnalyticsFilters,
  resetAnalyticsFilters,
} from "@/redux/Slices/analyticsSlice"
import { fetchSubscriptions } from "@/redux/Slices/subscriptionSlice"
import { fetchInvoices } from "@/redux/Slices/invoiceSlice"
import { fetchCustomers } from "@/redux/Slices/customerSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  RotateCcw,
  Boxes,
  FileText,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  PieChart,
  IndianRupee,
} from "lucide-react"

export default function AdminAnalyticsDashboard() {
  const dispatch = useDispatch()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { overview, revenue, subscriptions: subAnalytics, invoices: invAnalytics, filters } =
    useSelector((state) => state.analytics)
  const { subscriptions } = useSelector((state) => state.subscription)
  const { invoices } = useSelector((state) => state.invoice)
  const { customers } = useSelector((state) => state.customer)

  const [dateRange, setDateRange] = React.useState("Oct 01, 2026 - Oct 31, 2026")
  const [period, setPeriod] = React.useState(filters.period || "Monthly")
  const [customerFilter, setCustomerFilter] = React.useState(filters.customerId || "all")
  const [subStatusFilter, setSubStatusFilter] = React.useState(filters.subscriptionStatus || "all")
  const [invStatusFilter, setInvStatusFilter] = React.useState(filters.invoiceStatus || "all")

  React.useEffect(() => {
    dispatch(fetchAnalyticsOverview())
    dispatch(fetchRevenueAnalytics({ granularity: period.toLowerCase() }))
    dispatch(fetchSubscriptionAnalytics())
    dispatch(fetchInvoiceAnalytics())
    dispatch(fetchSubscriptions({ limit: 5 }))
    dispatch(fetchInvoices({ limit: 5 }))
    dispatch(fetchCustomers({ limit: 100 }))
  }, [dispatch, period])

  const handleReset = () => {
    setPeriod("Monthly")
    setCustomerFilter("all")
    setSubStatusFilter("all")
    setInvStatusFilter("all")
    dispatch(resetAnalyticsFilters())
  }

  // Monthly revenue mock bars
  const revenueBars = [
    { label: "Jan", height: "30%", value: "₹ 1.2L" },
    { label: "Feb", height: "40%", value: "₹ 1.6L" },
    { label: "Mar", height: "50%", value: "₹ 2.0L" },
    { label: "Apr", height: "60%", value: "₹ 2.4L" },
    { label: "May", height: "52%", value: "₹ 2.1L" },
    { label: "Jun", height: "68%", value: "₹ 2.7L" },
    { label: "Jul", height: "78%", value: "₹ 3.1L" },
    { label: "Aug", height: "72%", value: "₹ 2.9L" },
    { label: "Sep", height: "88%", value: "₹ 2,48,000", highlight: true },
    { label: "Oct", height: "80%", value: "₹ 3.2L" },
    { label: "Nov", height: "90%", value: "₹ 3.6L" },
    { label: "Dec", height: "100%", value: "₹ 4.0L" },
  ]

  // Overdue invoices filtered list
  const overdueInvoices = (invoices || []).filter(
    (inv) => (inv.status || "").toLowerCase() === "overdue" || inv.outstandingAmount > 0
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Key metrics, revenue insights and subscription performance.
        </p>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
            {dateRange}
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="Daily">Daily</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Customers</option>
            {customers?.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={subStatusFilter}
            onChange={(e) => setSubStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subscription Status</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={invStatusFilter}
            onChange={(e) => setInvStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Invoice Status</option>
            <option value="Paid">Paid</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Draft">Draft</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Reset
        </button>
      </div>

      {/* ── 5 Summary KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Active Subscriptions
            </span>
            <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {overview?.activeSubscriptions ?? 124}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            <ArrowUpRight className="size-3.5" />
            <span>↑ 12% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Revenue Collected
            </span>
            <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(overview?.revenueCollected ?? 124800000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            <ArrowUpRight className="size-3.5" />
            <span>↑ 18% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Outstanding Amount
            </span>
            <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(overview?.outstandingAmount ?? 32450000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
            <ArrowDownRight className="size-3.5" />
            <span>↓ 8% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Overdue Invoices
            </span>
            <div className="size-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {overview?.overdueInvoices ?? 18}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
            <ArrowDownRight className="size-3.5" />
            <span>↓ 5% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Upcoming Renewals
            </span>
            <div className="size-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <RefreshCw className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {overview?.upcomingRenewals ?? 27}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            <ArrowUpRight className="size-3.5" />
            <span>↑ 20% from last month</span>
          </div>
        </div>
      </div>

      {/* ── 3 Visual Chart Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Revenue Overview Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Revenue Overview
                </h3>
                <p className="text-[11px] text-slate-400">Total revenue collected over time.</p>
              </div>
              <BarChart2 className="size-4 text-slate-400" />
            </div>

            {/* Custom Bar Visualization */}
            <div className="h-56 mt-6 flex items-end justify-between gap-1.5 pt-8 pb-2 relative border-b border-slate-100 dark:border-slate-800">
              {/* Horizontal grid lines */}
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-100 dark:border-slate-800/60" />
              <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 dark:border-slate-800/60" />
              <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 dark:border-slate-800/60" />
              <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 dark:border-slate-800/60" />

              {revenueBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                  {bar.highlight && (
                    <div className="absolute -top-7 bg-slate-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
                      {bar.value}
                    </div>
                  )}
                  <div
                    style={{ height: bar.height }}
                    className={`w-full max-w-[18px] rounded-t transition-all duration-300 ${
                      bar.highlight
                        ? "bg-blue-600 shadow-sm"
                        : "bg-blue-300 dark:bg-blue-900/60 hover:bg-blue-400"
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-2 font-medium">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
            <span>₹ 0</span>
            <span>₹ 1,00,000</span>
            <span>₹ 2,00,000</span>
            <span>₹ 3,00,000</span>
            <span>₹ 4,00,000</span>
          </div>
        </div>

        {/* Chart 2: Subscription Performance (2 Donut charts) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Subscription Performance
                </h3>
                <p className="text-[11px] text-slate-400">Subscription status and plan distribution.</p>
              </div>
              <PieChart className="size-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Donut 1: By Status */}
              <div className="flex flex-col items-center">
                <div className="size-28 rounded-full border-8 border-emerald-500 border-t-amber-500 border-r-red-500 flex items-center justify-center relative">
                  <div className="text-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white block leading-none">
                      124
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase">Total</span>
                  </div>
                </div>
                <div className="mt-4 space-y-1 w-full text-[11px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">Active</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">89 (72%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span className="text-slate-600 dark:text-slate-400">Paused</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">18 (14%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-red-500" />
                      <span className="text-slate-600 dark:text-slate-400">Closed</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">17 (14%)</span>
                  </div>
                </div>
              </div>

              {/* Donut 2: By Plan */}
              <div className="flex flex-col items-center">
                <div className="size-28 rounded-full border-8 border-blue-500 border-t-purple-500 border-r-cyan-500 border-l-pink-500 flex items-center justify-center relative">
                  <div className="text-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white block leading-none">
                      124
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase">Total</span>
                  </div>
                </div>
                <div className="mt-4 space-y-1 w-full text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 truncate">Business</span>
                    <span className="font-semibold text-slate-900 dark:text-white">48 (39%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 truncate">Enterprise</span>
                    <span className="font-semibold text-slate-900 dark:text-white">32 (26%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 truncate">Starter</span>
                    <span className="font-semibold text-slate-900 dark:text-white">24 (19%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 truncate">Support</span>
                    <span className="font-semibold text-slate-900 dark:text-white">20 (16%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Invoice Status */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invoice Status
                </h3>
                <p className="text-[11px] text-slate-400">Distribution of invoices by status.</p>
              </div>
              <FileText className="size-4 text-slate-400" />
            </div>

            <div className="flex flex-col items-center mt-6">
              <div className="size-28 rounded-full border-8 border-emerald-500 border-t-blue-500 border-r-slate-400 border-l-red-500 flex items-center justify-center relative">
                <div className="text-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block leading-none">
                    48
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">Total</span>
                </div>
              </div>

              <div className="mt-5 space-y-1.5 w-full text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Draft</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">6 (12%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span className="text-slate-600 dark:text-slate-400">Confirmed</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">18 (38%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-400">Paid</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">16 (33%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span className="text-slate-600 dark:text-slate-400">Overdue</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">8 (17%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Dashboard Tables ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table 1: Recent Subscriptions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Recent Subscriptions
            </h3>
            <Link
              to={`${basePath}/subscriptions`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Sub. No</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(subscriptions || []).slice(0, 5).map((sub, idx) => (
                <tr key={sub._id || sub.id || idx}>
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {sub.subscriptionNumber || `SUB-00${12 - idx}`}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                    {sub.customer?.name || sub.customerName || "Customer"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-[80px]">
                    {sub.plan?.name || "Business"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active
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
            <Link
              to={`${basePath}/invoices`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(invoices || []).slice(0, 5).map((inv, idx) => (
                <tr key={inv._id || inv.id || idx}>
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {inv.invoiceNumber || `INV-2026-00${idx + 1}`}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                    {inv.customer?.name || inv.customerName || "Customer"}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                    {formatCurrency(inv.totalAmount || inv.total || 5000000)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      Paid
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
            <Link
              to={`${basePath}/invoices`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {[
                { no: "INV-2026-002", cust: "Globex Ltd", due: "Oct 15, 2026", out: 6000000 },
                { no: "INV-2026-007", cust: "Oscorp", due: "Oct 08, 2026", out: 6000000 },
                { no: "INV-2026-009", cust: "Wayne Enterprises", due: "Sep 28, 2026", out: 2500000 },
                { no: "INV-2026-010", cust: "Cyberdyne Systems", due: "Sep 20, 2026", out: 1200000 },
                { no: "INV-2026-011", cust: "Initech", due: "Sep 18, 2026", out: 1800000 },
              ].map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {row.no}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                    {row.cust}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{row.due}</td>
                  <td className="py-2.5 px-3 font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(row.out)}
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

