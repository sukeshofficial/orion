// src/pages/portal/SubscriptionDetails.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams, Link } from "react-router-dom"
import {
  fetchSubscriptionById,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  closeSubscription,
} from "@/redux/Slices/subscriptionSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ArrowLeft,
  Boxes,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react"

export default function SubscriptionDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()

  const { selectedSubscription: sub, detailLoading: loading } = useSelector(
    (state) => state.subscription
  )

  const [activeTab, setActiveTab] = React.useState("overview")

  React.useEffect(() => {
    if (id) {
      dispatch(fetchSubscriptionById(id))
    }
  }, [dispatch, id])

  const handleAction = async (action) => {
    if (action === "pause") {
      await dispatch(pauseSubscription({ id, reason: "Customer requested pause" }))
    } else if (action === "resume") {
      await dispatch(resumeSubscription(id))
    } else if (action === "renew") {
      await dispatch(renewSubscription(id))
    } else if (action === "close") {
      await dispatch(closeSubscription({ id, reason: "Customer requested closure" }))
    }
    dispatch(fetchSubscriptionById(id))
  }

  const subNum = sub?.subscriptionNumber || (sub?._id ? `SUB-${sub._id.slice(-6).toUpperCase()}` : "Subscription")
  const planName = sub?.plan?.name || sub?.planName || "Plan"
  const status = (sub?.status || "active").toLowerCase()
  const customer = sub?.customer || sub?.customerId || {}
  const custName = customer.name || customer.companyName || "—"
  const custEmail = customer.email || customer.userId?.email || "—"
  const custPhone = customer.phone || "—"
  const custCompany = customer.companyName || customer.company || "—"
  const cAddr = customer.billingAddress || customer.address
  const custAddress = typeof cAddr === "string" ? cAddr : cAddr ? [cAddr.street, cAddr.city, cAddr.country].filter(Boolean).join(", ") : "—"

  const capabilities = sub?.plan?.capabilities || {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link
            to="/portal/subscriptions"
            className="text-xs text-slate-500 hover:text-blue-600 transition flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Subscriptions</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Boxes className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {subNum}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 capitalize">
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{planName}</span>
                {" · "}
                <span className="capitalize">{sub?.billingInterval || "Monthly"}</span>
                {" · "}
                <span>
                  {sub?.startDate ? formatDate(sub.startDate) : "—"} - {sub?.expiryDate ? formatDate(sub.expiryDate) : "—"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-center">
          {status === "active" ? (
            <button
              type="button"
              onClick={() => handleAction("pause")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 hover:bg-amber-100 transition border border-amber-200 dark:border-amber-900/50"
            >
              <PauseCircle className="size-3.5" />
              <span>Pause</span>
            </button>
          ) : status === "paused" ? (
            <button
              type="button"
              onClick={() => handleAction("resume")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 hover:bg-blue-100 transition border border-blue-200 dark:border-blue-900/50"
            >
              <PlayCircle className="size-3.5" />
              <span>Resume</span>
            </button>
          ) : null}

          {status !== "closed" && (
            <button
              type="button"
              onClick={() => handleAction("close")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 hover:bg-red-100 transition border border-red-200 dark:border-red-900/50"
            >
              <XCircle className="size-3.5" />
              <span>Close</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleAction("renew")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
          >
            <RefreshCw className="size-3.5" />
            <span>Renew</span>
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-medium">
        {[
          { key: "overview", label: "Overview" },
          { key: "products", label: "Products & Variants" },
          { key: "billing", label: "Billing" },
          { key: "invoices", label: "Invoices" },
          { key: "payments", label: "Payments" },
          { key: "activity", label: "Activity History" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Subscription Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Subscription Information
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Subscription No.</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {subNum}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Plan</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                  {planName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Billing Interval</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {sub?.billingInterval || "Monthly"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Start Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {sub?.startDate ? formatDate(sub.startDate) : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Expiry Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {sub?.expiryDate ? formatDate(sub.expiryDate) : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Next Billing Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {sub?.nextBillingDate ? formatDate(sub.nextBillingDate) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Customer Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </h2>
            <div className="space-y-3 text-xs">
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

          {/* Card 3: Plan Usage & Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                Plan Usage
              </h2>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-900 dark:text-white">Active Subscription</span>
                <span className="text-emerald-500 font-bold capitalize">{status}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Auto-close at expiry</span>
                <span className={`font-semibold ${capabilities.autoCloseAtExpiry !== false ? "text-emerald-600" : "text-slate-400"}`}>
                  {capabilities.autoCloseAtExpiry !== false ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Allow early closure</span>
                <span className={`font-semibold ${capabilities.allowEarlyClosure !== false ? "text-emerald-600" : "text-slate-400"}`}>
                  {capabilities.allowEarlyClosure !== false ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Allow pause</span>
                <span className={`font-semibold ${capabilities.allowPause !== false ? "text-emerald-600" : "text-slate-400"}`}>
                  {capabilities.allowPause !== false ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Allow renewal</span>
                <span className={`font-semibold ${capabilities.allowRenewal !== false ? "text-emerald-600" : "text-slate-400"}`}>
                  {capabilities.allowRenewal !== false ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Other Tabs Fallback ─────────────────────────────────────────── */}
      {activeTab !== "overview" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs text-xs text-slate-500">
          Viewing {activeTab} information for subscription {subNum}.
        </div>
      )}
    </div>
  )
}

