// src/pages/portal/MySubscriptions.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import {
  fetchSubscriptions,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  closeSubscription,
} from "@/redux/Slices/subscriptionSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  Boxes,
  Search,
  MoreVertical,
  Eye,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react"

export default function MySubscriptions() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { subscriptions, loading } = useSelector((state) => state.subscription)

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [activeMenuId, setActiveMenuId] = React.useState(null)

  React.useEffect(() => {
    dispatch(fetchSubscriptions({ limit: 50 }))
  }, [dispatch])

  const mySubs = React.useMemo(() => {
    return (subscriptions || []).filter((sub) => {
      const q = search.toLowerCase()
      const planName = (sub.plan?.name || sub.planName || "").toLowerCase()
      const subNum = (sub.subscriptionNumber || "").toLowerCase()
      const matchesSearch = !search || planName.includes(q) || subNum.includes(q)
      const matchesStatus =
        statusFilter === "all" ||
        (sub.status || "").toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [subscriptions, search, statusFilter])

  const handleAction = async (action, id) => {
    setActiveMenuId(null)
    if (action === "pause") {
      await dispatch(pauseSubscription({ id, reason: "Customer requested pause" }))
    } else if (action === "resume") {
      await dispatch(resumeSubscription(id))
    } else if (action === "renew") {
      await dispatch(renewSubscription(id))
    } else if (action === "close") {
      await dispatch(closeSubscription({ id, reason: "Customer requested closure" }))
    }
    dispatch(fetchSubscriptions({ limit: 50 }))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Subscriptions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View your active subscriptions and manage them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/portal/subscriptions")}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm self-start sm:self-center"
        >
          <span>View Plan Details</span>
        </button>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 self-end sm:self-center"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="size-8 animate-spin mb-2 text-blue-600" />
            <span className="text-xs">Loading subscriptions...</span>
          </div>
        ) : mySubs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No subscriptions found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Billing Interval</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {mySubs.map((sub, idx) => {
                  const sId = sub._id || sub.id
                  const status = (sub.status || "Active").toLowerCase()
                  const planName = sub.plan?.name || sub.planName || "Business Plan"

                  return (
                    <tr key={sId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/portal/subscriptions/${sId}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {planName}
                        </Link>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {sub.subscriptionNumber || `SUB-00${12 - idx}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(sub.startDate || "2026-10-01")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(sub.expiryDate || "2027-10-01")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {sub.billingInterval || "Monthly"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            status === "active"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : status === "paused"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              status === "active"
                                ? "bg-emerald-500"
                                : status === "paused"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="capitalize">{status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === sId ? null : sId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {activeMenuId === sId && (
                          <div
                            onClick={() => setActiveMenuId(null)}
                            className="absolute right-4 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-30 text-left text-xs"
                          >
                            <Link
                              to={`/portal/subscriptions/${sId}`}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Eye className="size-3.5" />
                              <span>View Details</span>
                            </Link>

                            {status === "active" && (
                              <button
                                onClick={() => handleAction("pause", sId)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600"
                              >
                                <PauseCircle className="size-3.5" />
                                <span>Pause Subscription</span>
                              </button>
                            )}

                            {status === "paused" && (
                              <button
                                onClick={() => handleAction("resume", sId)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                              >
                                <PlayCircle className="size-3.5" />
                                <span>Resume Subscription</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleAction("renew", sId)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-purple-600"
                            >
                              <RefreshCw className="size-3.5" />
                              <span>Renew Subscription</span>
                            </button>

                            {status !== "closed" && (
                              <button
                                onClick={() => handleAction("close", sId)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-red-600"
                              >
                                <XCircle className="size-3.5" />
                                <span>Close Subscription</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>Showing 1 to {mySubs.length} of {mySubs.length} subscriptions</div>
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

