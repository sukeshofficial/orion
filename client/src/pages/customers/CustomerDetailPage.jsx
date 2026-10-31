// src/pages/customers/CustomerDetailPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  fetchCustomerById,
  fetchCustomerSubscriptions,
  fetchCustomerInvoices,
  updateCustomer,
  clearSelectedCustomer,
} from "@/redux/Slices/customerSlice"
import {
  ChevronLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Layers,
  FileText,
  CreditCard,
  Receipt,
  Pencil,
  ChevronDown,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
      <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
      Inactive
    </span>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  )
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-[#2563EB] text-[#2563EB]"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      <Icon className="size-4" />
      {label}
      {count !== undefined && (
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
            active
              ? "bg-[#EFF6FF] text-[#2563EB]"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Subscription Row ─────────────────────────────────────────────────────────

function SubscriptionRow({ sub }) {
  const statusColor =
    sub.status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : sub.status === "paused"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-600 border-slate-200"

  return (
    <tr className="border-b border-border/60 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {sub.subscriptionNumber ?? sub.id?.slice(-8) ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {sub.planName ?? sub.plan?.name ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
          {sub.status ?? "unknown"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(sub.startDate ?? sub.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {sub.amount != null
          ? `$${Number(sub.amount).toFixed(2)}`
          : "—"}
      </td>
    </tr>
  )
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

function InvoiceRow({ inv }) {
  const isPaid = inv.status === "paid"
  const statusColor = isPaid
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : inv.status === "overdue"
    ? "bg-red-50 text-red-600 border-red-200"
    : "bg-amber-50 text-amber-700 border-amber-200"

  return (
    <tr className="border-b border-border/60 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-[#2563EB] font-mono">
        {inv.invoiceNumber ?? inv.id?.slice(-8) ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
          {inv.status ?? "pending"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(inv.dueDate ?? inv.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-foreground">
        {inv.total != null ? `$${Number(inv.total).toFixed(2)}` : "—"}
      </td>
    </tr>
  )
}

// ─── Empty Related State ──────────────────────────────────────────────────────

function EmptyRelated({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="size-12 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/40 flex items-center justify-center">
        <Icon className="size-6 text-[#2563EB]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">{description}</p>
      </div>
    </div>
  )
}

// ─── Coming Soon Tab ──────────────────────────────────────────────────────────

function ComingSoonTab({ icon: Icon, label, phase }) {
  return (
    <EmptyRelated
      icon={Icon}
      title={`${label} — Coming Soon`}
      description={`${label} will be available when ${phase} is implemented.`}
    />
  )
}

// ─── More Menu ────────────────────────────────────────────────────────────────

function MoreMenu({ customer, onToggleActive, loading }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/70 bg-white text-sm font-medium text-foreground hover:bg-muted transition-colors dark:bg-[#111827] dark:border-white/10"
      >
        More
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-border/80 bg-white dark:bg-[#111827] shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => { setOpen(false); onToggleActive(!customer.isActive) }}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
              customer.isActive
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : customer.isActive ? (
              <XCircle className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {customer.isActive ? "Deactivate Customer" : "Activate Customer"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton Detail ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6">
      <div className="h-5 w-36 rounded-full bg-muted animate-pulse" />
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-64 rounded-full bg-muted/60 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/40">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-20 rounded-full bg-muted/60 animate-pulse" />
              <div className="h-4 w-32 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 rounded-full bg-muted animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview", icon: CheckCircle2 },
  { key: "subscriptions", label: "Subscriptions", icon: Layers },
  { key: "quotations", label: "Quotations", icon: FileText },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "payments", label: "Payments", icon: CreditCard },
]

export default function CustomerDetailPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const { selectedCustomer, detailLoading, relatedLoading, subscriptions, invoices, loading } =
    useSelector((s) => s.customer)

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const [activeTab, setActiveTab] = React.useState("overview")
  const [loadedTabs, setLoadedTabs] = React.useState(new Set())

  // Fetch customer detail on mount
  React.useEffect(() => {
    dispatch(fetchCustomerById(id))
    return () => {
      dispatch(clearSelectedCustomer())
    }
  }, [dispatch, id])

  // Lazy-load related data when tab is first opened
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (!loadedTabs.has(tab)) {
      setLoadedTabs((prev) => new Set([...prev, tab]))
      if (tab === "subscriptions") dispatch(fetchCustomerSubscriptions(id))
      if (tab === "invoices") dispatch(fetchCustomerInvoices(id))
    }
  }

  // Toggle active status
  const handleToggleActive = (newIsActive) => {
    dispatch(updateCustomer({ id, payload: { isActive: newIsActive } }))
  }

  if (detailLoading) return <DetailSkeleton />

  if (!selectedCustomer) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center gap-4">
        <div className="size-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="size-7 text-red-500" />
        </div>
        <p className="text-sm font-semibold text-foreground">Customer not found</p>
        <Link
          to={`${basePath}/customers`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Customers
        </Link>
      </div>
    )
  }

  const c = selectedCustomer
  const name = c.userId?.name || c.name || c.companyName || "—"
  const email = c.userId?.email || c.email || "—"
  const userInitial = name.charAt(0).toUpperCase()
  const address = c.billingAddress
  const addressLine = address
    ? [address.street, address.city, address.state, address.postalCode, address.country]
        .filter(Boolean)
        .join(", ")
    : "—"

  const googleMapsUrl = address
    ? `https://www.google.com/maps/search/${encodeURIComponent(addressLine)}`
    : "#"

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          to={`${basePath}/customers`}
          className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
        >
          <ChevronLeft className="size-4" />
          Customers
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium font-mono text-xs">
          {c.customerNumber ?? id}
        </span>
      </nav>

      {/* ── Profile Header Card ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="p-6">
          {/* Top row: avatar + name + actions */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="size-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">{name}</h1>
                  <StatusBadge isActive={c.isActive} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  <span className="font-mono text-xs text-[#2563EB] font-medium">
                    {c.customerNumber ?? "—"}
                  </span>
                  {" · "}
                  {email}
                  {c.companyName && ` · ${c.companyName}`}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`${basePath}/customers/${id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/70 bg-white text-sm font-medium text-foreground hover:bg-muted transition-colors dark:bg-[#111827] dark:border-white/10"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <MoreMenu
                customer={c}
                onToggleActive={handleToggleActive}
                loading={loading}
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border/60">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Company
              </p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                {c.companyName || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Phone
              </p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                {c.phone || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Customer Since
              </p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                {formatDate(c.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Subscriptions
              </p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-muted-foreground" />
                {subscriptions.length > 0 ? subscriptions.length : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ─────────────────────────────────────────────── */}
        <div className="border-t border-border/60 overflow-x-auto">
          <div className="flex px-4 gap-0 min-w-max">
            {TABS.map((tab) => (
              <TabBtn
                key={tab.key}
                active={activeTab === tab.key}
                onClick={() => handleTabChange(tab.key)}
                icon={tab.icon}
                label={tab.label}
                count={
                  tab.key === "subscriptions" && loadedTabs.has("subscriptions")
                    ? subscriptions.length
                    : tab.key === "invoices" && loadedTabs.has("invoices")
                    ? invoices.length
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-0">
              <InfoRow icon={CheckCircle2} label="Name" value={name} />
              <InfoRow icon={Mail} label="Email" value={email} />
              <InfoRow icon={Phone} label="Phone" value={c.phone} />
              <InfoRow icon={Building2} label="Company" value={c.companyName} />
              <InfoRow
                icon={FileText}
                label="Tax Identification Number"
                value={c.taxIdentificationNumber}
              />
            </div>
          </div>

          {/* Billing Address + summary stats */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Billing Address</h2>
                {address && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                  >
                    View on Map
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              {address ? (
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-muted-foreground mt-1 shrink-0" />
                  <div className="text-sm text-foreground leading-6">
                    <p>{address.street}</p>
                    {address.city && (
                      <p>
                        {address.city}
                        {address.state ? `, ${address.state}` : ""}
                        {address.postalCode ? ` ${address.postalCode}` : ""}
                      </p>
                    )}
                    {address.country && <p>{address.country}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No billing address on file.</p>
              )}
            </div>

            {/* Summary stats */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Customer Since
                </p>
                <p className="text-base font-bold text-foreground">{formatDate(c.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Total Subscriptions
                </p>
                <p className="text-base font-bold text-foreground">
                  {loadedTabs.has("subscriptions") ? subscriptions.length : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Subscriptions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All subscriptions linked to this customer.
            </p>
          </div>
          {relatedLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Loading subscriptions…</span>
            </div>
          ) : subscriptions.length === 0 ? (
            <EmptyRelated
              icon={Layers}
              title="No subscriptions found"
              description="This customer has no active or historical subscriptions yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Subscription #
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <SubscriptionRow key={sub.id ?? sub._id} sub={sub} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quotations Tab */}
      {activeTab === "quotations" && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Quotations</h2>
          </div>
          <ComingSoonTab
            icon={FileText}
            label="Quotations"
            phase="Phase 5 (Quotation Management)"
          />
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Invoices</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All invoices generated for this customer.
            </p>
          </div>
          {relatedLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Loading invoices…</span>
            </div>
          ) : invoices.length === 0 ? (
            <EmptyRelated
              icon={Receipt}
              title="No invoices found"
              description="No invoices have been generated for this customer yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <InvoiceRow key={inv.id ?? inv._id} inv={inv} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Payments</h2>
          </div>
          <ComingSoonTab
            icon={CreditCard}
            label="Payments"
            phase="Phase 6 (Billing & Payments)"
          />
        </div>
      )}
    </div>
  )
}

