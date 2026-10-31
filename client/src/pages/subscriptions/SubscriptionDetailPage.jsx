// src/pages/subscriptions/SubscriptionDetailPage.jsx
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  fetchSubscriptionById,
  pauseSubscription,
  resumeSubscription,
  closeSubscription,
  activateSubscription,
  confirmSubscription,
  renewSubscription,
} from "@/redux/Slices/subscriptionSlice";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Clock,
  IndianRupee,
  PauseCircle,
  XCircle,
  MoreHorizontal,
  PlayCircle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Package,
  User,
  FileText,
  CreditCard,
  History,
  LayoutGrid,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Receipt,
  Banknote,
  Tag,
} from "lucide-react";

// ─── Alias: the spec says fetchSubscription but the slice exports fetchSubscriptionById ─
const fetchSubscription = fetchSubscriptionById;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Active: {
    label: "Active",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  Paused: {
    label: "Paused",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  Draft: {
    label: "Draft",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  Confirmed: {
    label: "Confirmed",
    bg: "bg-violet-100 dark:bg-violet-900/40",
    text: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  Closed: {
    label: "Closed",
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border/60 last:border-0 gap-4">
      <span className="text-sm text-muted-foreground shrink-0 w-40">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function ToggleRow({ label, description, enabled }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">
        {enabled ? (
          <ToggleRight className="size-7 text-blue-500" />
        ) : (
          <ToggleLeft className="size-7 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const STAT_COLOR_MAP = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
};

function StatCard({ icon: Icon, label, value, color = "blue", sub }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-5 flex items-center gap-4">
      <div
        className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${STAT_COLOR_MAP[color]}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </p>
        <p className="text-xl font-bold text-foreground leading-tight mt-0.5 truncate">
          {value || "—"}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "products", label: "Products & Variants", icon: Package },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: Banknote },
  { id: "activity", label: "Activity History", icon: History },
];

// ─── Placeholder empty state ──────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="size-12 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Modal for reason input (pause / close) ───────────────────────────────────

function ReasonModal({ open, title, placeholder, onConfirm, onCancel, loading }) {
  const [reason, setReason] = React.useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <textarea
          className="w-full rounded-xl border border-border bg-background text-sm px-3 py-2.5 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[96px]"
          placeholder={placeholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubscriptionDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { selectedSubscription: subscription, detailLoading: loading, actionLoading, error } =
    useSelector((state) => state.subscription);

  const [activeTab, setActiveTab] = React.useState("overview");
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);
  const [modal, setModal] = React.useState(null); // { type: "pause" | "close" }
  const actionsRef = React.useRef(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (id) dispatch(fetchSubscription(id));
  }, [dispatch, id]);

  // ── Close dropdown on outside click ───────────────────────────────────────
  React.useEffect(() => {
    const handler = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Lifecycle handler ──────────────────────────────────────────────────────
  const handleLifecycleAction = async (action, reason) => {
    setShowActionsMenu(false);
    const thunks = {
      pause: () => dispatch(pauseSubscription({ id, reason })),
      resume: () => dispatch(resumeSubscription(id)),
      close: () => dispatch(closeSubscription({ id, reason })),
      activate: () => dispatch(activateSubscription(id)),
      confirm: () => dispatch(confirmSubscription(id)),
      renew: () => dispatch(renewSubscription(id)),
    };
    if (thunks[action]) {
      await thunks[action]();
      dispatch(fetchSubscription(id));
    }
  };

  const openModal = (type) => {
    setShowActionsMenu(false);
    setModal({ type });
  };

  const handleModalConfirm = async (reason) => {
    if (!modal) return;
    await handleLifecycleAction(modal.type, reason);
    setModal(null);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const status = subscription?.status || "Draft";

  const customerName =
    subscription?.customerId?.companyName ||
    subscription?.customerId?.userId?.name ||
    subscription?.customerId?.name ||
    subscription?.customer?.displayName ||
    subscription?.customer?.name ||
    subscription?.customerName ||
    "—";
  const customerId =
    subscription?.customerId?._id ||
    subscription?.customerId?.id ||
    subscription?.customer?._id ||
    subscription?.customer?.id ||
    (typeof subscription?.customerId === "string" ? subscription.customerId : null);

  const planName =
    subscription?.plan?.name || subscription?.planName || "—";
  const planId =
    subscription?.plan?._id || subscription?.plan?.id || subscription?.planId;

  const billingInterval = subscription?.billingInterval || subscription?.plan?.billingInterval || "—";
  const paymentTerms = subscription?.paymentTerms || subscription?.plan?.paymentTerms || "—";

  const products =
    subscription?.products ||
    subscription?.plan?.products ||
    [];

  const invoices = subscription?.invoices || [];
  const payments = subscription?.payments || [];
  const activityLog = subscription?.activityLog || subscription?.history || [];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && !subscription) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-9 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading subscription…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && !subscription) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center p-6">
          <div className="size-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
            <AlertCircle className="size-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Failed to load subscription</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
          <button
            onClick={() => dispatch(fetchSubscription(id))}
            className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Tab content ────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Subscription Information */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Subscription Information</h3>
        <InfoRow label="Subscription No." value={subscription?.subscriptionNumber || "—"} />
        <InfoRow
          label="Customer"
          value={
            customerId ? (
              <Link
                to={`/customers/${customerId}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {customerName}
              </Link>
            ) : (
              customerName
            )
          }
        />
        <InfoRow
          label="Plan"
          value={
            planId ? (
              <Link
                to={`/plans/${planId}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {planName}
              </Link>
            ) : (
              planName
            )
          }
        />
        <InfoRow label="Status" value={<StatusBadge status={status} />} />
        <InfoRow label="Billing Interval" value={billingInterval} />
        <InfoRow label="Payment Terms" value={paymentTerms} />
        <InfoRow
          label="Created Date"
          value={formatDate(subscription?.createdAt)}
        />
      </div>

      {/* Lifecycle Controls */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Lifecycle Controls</h3>
        <ToggleRow
          label="Auto-close at expiry"
          description="Automatically close subscription when it reaches its expiry date"
          enabled={subscription?.autoCloseAtExpiry ?? true}
        />
        <ToggleRow
          label="Allow early closure"
          description="Permit closing the subscription before the expiry date"
          enabled={subscription?.allowEarlyClosure ?? true}
        />
        <ToggleRow
          label="Allow pause"
          description="Allow pausing the subscription mid-cycle"
          enabled={subscription?.allowPause ?? true}
        />
        <ToggleRow
          label="Allow renewal"
          description="Automatically or manually renew after expiry"
          enabled={subscription?.allowRenewal ?? true}
        />
      </div>
    </div>
  );

  const renderProducts = () => {
    if (!products.length) {
      return (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <EmptyState icon={Package} title="No products found" subtitle="This subscription has no products or variants configured." />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60">
          <h3 className="text-sm font-semibold text-foreground">Products &amp; Variants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variant</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((p, idx) => {
                const unitPrice = p.unitPrice ?? p.price ?? 0;
                const qty = p.quantity ?? 1;
                const taxPct = p.tax ?? p.taxRate ?? 0;
                const subtotal = unitPrice * qty;
                const taxAmt = subtotal * (taxPct / 100);
                const total = subtotal + taxAmt;
                return (
                  <tr key={p._id || p.id || idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {p.product?.name || p.productName || p.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.variant?.name || p.variantName || "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-foreground">{qty}</td>
                    <td className="px-6 py-4 text-right text-foreground">
                      {formatCurrency(unitPrice, false)}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {taxPct}%
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      {formatCurrency(total, false)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBilling = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Billing Cycle</h3>
        <InfoRow label="Billing Interval" value={billingInterval} />
        <InfoRow label="Payment Terms" value={paymentTerms} />
        <InfoRow label="Start Date" value={formatDate(subscription?.startDate)} />
        <InfoRow label="Expiry Date" value={formatDate(subscription?.expiryDate)} />
        <InfoRow
          label="Next Billing Date"
          value={formatDate(subscription?.nextBillingDate)}
        />
        <InfoRow
          label="Total Amount"
          value={formatCurrency(subscription?.totalAmount ?? subscription?.amount ?? 0, false)}
        />
      </div>
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Payment Summary</h3>
        <InfoRow
          label="Total Invoiced"
          value={formatCurrency(subscription?.totalInvoiced ?? 0, false)}
        />
        <InfoRow
          label="Total Paid"
          value={formatCurrency(subscription?.totalPaid ?? 0, false)}
        />
        <InfoRow
          label="Outstanding"
          value={formatCurrency(
            (subscription?.totalInvoiced ?? 0) - (subscription?.totalPaid ?? 0),
            false
          )}
        />
        <InfoRow label="Invoice Count" value={invoices.length || "—"} />
      </div>
    </div>
  );

  const INVOICE_STATUS_STYLE = {
    Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    Pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    Overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    Draft: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  };

  const renderInvoices = () => {
    if (!invoices.length) {
      return (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <EmptyState icon={FileText} title="No invoices yet" subtitle="Invoices will appear here once billing cycles begin." />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60">
          <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice No.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoices.map((inv, idx) => (
                <tr key={inv._id || inv.id || idx} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">
                    <Link to={`/invoices/${inv._id || inv.id}`} className="hover:underline">
                      {inv.invoiceNumber || inv.number || `INV-${idx + 1}`}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(inv.date || inv.createdAt)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-foreground">
                    {formatCurrency(inv.totalAmount ?? inv.amount ?? 0, false)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${INVOICE_STATUS_STYLE[inv.status] || INVOICE_STATUS_STYLE.Draft}`}>
                      {inv.status || "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/invoices/${inv._id || inv.id}`}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    if (!payments.length) {
      return (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <EmptyState icon={Banknote} title="No payments recorded" subtitle="Payments received for this subscription will appear here." />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60">
          <h3 className="text-sm font-semibold text-foreground">Payments Received</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Ref.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payments.map((pay, idx) => (
                <tr key={pay._id || pay.id || idx} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {pay.reference || pay.paymentNumber || `PAY-${idx + 1}`}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(pay.date || pay.createdAt)}</td>
                  <td className="px-6 py-4 text-muted-foreground capitalize">{pay.method || pay.paymentMethod || "—"}</td>
                  <td className="px-6 py-4 text-right font-semibold text-foreground">
                    {formatCurrency(pay.amount ?? 0, false)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      {pay.status || "Received"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ACTIVITY_ICONS = {
    created: CheckCircle2,
    confirmed: CheckCircle2,
    activated: PlayCircle,
    paused: PauseCircle,
    resumed: PlayCircle,
    renewed: RefreshCw,
    closed: XCircle,
  };

  const ACTIVITY_COLORS = {
    created: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    confirmed: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    activated: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    paused: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    resumed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    renewed: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    closed: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  };

  const renderActivity = () => {
    if (!activityLog.length) {
      return (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <EmptyState icon={History} title="No activity recorded" subtitle="Lifecycle events and changes will appear here." />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
        <h3 className="text-sm font-semibold text-foreground mb-6">Activity Timeline</h3>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />
          <div className="flex flex-col gap-0">
            {activityLog.map((event, idx) => {
              const eventType = (event.action || event.type || "created").toLowerCase();
              const Icon = ACTIVITY_ICONS[eventType] || History;
              const colorCls = ACTIVITY_COLORS[eventType] || ACTIVITY_COLORS.created;
              return (
                <div key={event._id || event.id || idx} className="flex gap-4 relative pl-1 pb-6 last:pb-0">
                  <div className={`size-9 rounded-full flex items-center justify-center shrink-0 z-10 ${colorCls}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <p className="text-sm font-semibold text-foreground capitalize">
                        {event.action || event.type || "Event"}
                      </p>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {formatDate(event.timestamp || event.createdAt || event.date)}
                      </p>
                    </div>
                    {event.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reason: {event.reason}
                      </p>
                    )}
                    {event.performedBy && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        By:{" "}
                        {event.performedBy?.name ||
                          event.performedBy?.displayName ||
                          event.performedBy}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const tabContent = {
    overview: renderOverview,
    products: renderProducts,
    billing: renderBilling,
    invoices: renderInvoices,
    payments: renderPayments,
    activity: renderActivity,
  };

  // ── Allowed header actions by status ──────────────────────────────────────
  const showPauseBtn   = status === "Active";
  const showResumeBtn  = status === "Paused";
  const showConfirmBtn = status === "Draft";
  const showActivateBtn= status === "Confirmed";
  const showCloseInDropdown  = status === "Active" || status === "Paused";
  const showRenewInDropdown  = status === "Active";
  const showActionsDropdown  = showCloseInDropdown || showRenewInDropdown;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Reason Modal */}
      <ReasonModal
        open={!!modal}
        title={
          modal?.type === "pause"
            ? "Pause Subscription"
            : modal?.type === "close"
            ? "Close Subscription"
            : ""
        }
        placeholder={
          modal?.type === "pause"
            ? "Enter reason for pausing (optional)…"
            : "Enter reason for closing (optional)…"
        }
        onConfirm={handleModalConfirm}
        onCancel={() => setModal(null)}
        loading={actionLoading}
      />

      <div className="flex flex-col gap-6 p-6 min-h-screen bg-background">
        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            to="/subscriptions"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Subscriptions
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">
            {subscription?.subscriptionNumber || id}
          </span>
        </div>

        {/* ── Header Row ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {subscription?.subscriptionNumber || "—"}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{customerName}</span>
              <span className="text-border">•</span>
              <span>{planName}</span>
              {(subscription?.startDate || subscription?.expiryDate) && (
                <>
                  <span className="text-border">•</span>
                  <span>
                    {formatDate(subscription?.startDate)}
                    {" – "}
                    {formatDate(subscription?.expiryDate)}
                  </span>
                </>
              )}
              {billingInterval && billingInterval !== "—" && (
                <>
                  <span className="text-border">•</span>
                  <span className="capitalize">{billingInterval}</span>
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Draft → Confirm */}
            {showConfirmBtn && (
              <button
                onClick={() => handleLifecycleAction("confirm")}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Confirm
              </button>
            )}

            {/* Confirmed → Activate */}
            {showActivateBtn && (
              <button
                onClick={() => handleLifecycleAction("activate")}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlayCircle className="size-4" />
                )}
                Activate
              </button>
            )}

            {/* Active → Pause */}
            {showPauseBtn && (
              <button
                onClick={() => openModal("pause")}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors shadow-sm"
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PauseCircle className="size-4" />
                )}
                Pause
              </button>
            )}

            {/* Paused → Resume */}
            {showResumeBtn && (
              <button
                onClick={() => handleLifecycleAction("resume")}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlayCircle className="size-4" />
                )}
                Resume
              </button>
            )}

            {/* Actions Dropdown */}
            {showActionsDropdown && (
              <div className="relative" ref={actionsRef}>
                <button
                  onClick={() => setShowActionsMenu((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-sm"
                >
                  <MoreHorizontal className="size-4" />
                  Actions
                </button>
                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-xl border border-border bg-card shadow-lg py-1.5 overflow-hidden">
                    {showRenewInDropdown && (
                      <button
                        onClick={() => handleLifecycleAction("renew")}
                        disabled={actionLoading}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-60"
                      >
                        <RefreshCw className="size-4 text-blue-500" />
                        Renew
                      </button>
                    )}
                    {showCloseInDropdown && (
                      <button
                        onClick={() => openModal("close")}
                        disabled={actionLoading}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-60"
                      >
                        <XCircle className="size-4" />
                        Close
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 4 Stat Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Calendar}
            label="Start Date"
            value={formatDate(subscription?.startDate)}
            color="blue"
          />
          <StatCard
            icon={CalendarDays}
            label="Expiry Date"
            value={formatDate(subscription?.expiryDate)}
            color="purple"
          />
          <StatCard
            icon={Clock}
            label="Next Billing"
            value={formatDate(subscription?.nextBillingDate)}
            color="amber"
          />
          <StatCard
            icon={IndianRupee}
            label="Total Amount"
            value={formatCurrency(
              subscription?.totalAmount ?? subscription?.amount ?? 0,
              false
            )}
            color="emerald"
          />
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-0">
          {/* Tab Bar */}
          <div className="flex items-center gap-0 border-b border-border/80 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="pt-6">
            {tabContent[activeTab]?.()}
          </div>
        </div>
      </div>
    </>
  );
}
