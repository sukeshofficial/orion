// src/pages/plans/PlanFormPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  createPlan,
  updatePlan,
  fetchPlanById,
  clearSelectedPlan,
} from "@/redux/Slices/planSlice"
import { fetchProducts } from "@/redux/Slices/productSlice"
import { toMinorUnits, fromMinorUnits, formatDateInput } from "@/lib/formatters"
import {
  ChevronLeft,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react"

export default function PlanFormPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedPlan, detailLoading, actionLoading, error } = useSelector(
    (state) => state.plan
  )
  const { products } = useSelector((state) => state.product)

  // ── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    productId: "",
    variantId: "",
    price: "",
    billingInterval: "monthly",
    minimumQuantity: 1,
    autoCloseAtExpiry: false,
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
    availableFrom: "",
    availableUntil: "",
    notes: "",
  })

  const [formErrors, setFormErrors] = React.useState({})

  // Fetch products on mount
  React.useEffect(() => {
    dispatch(fetchProducts({ limit: 100, isActive: true }))
  }, [dispatch])

  // Fetch plan if edit
  React.useEffect(() => {
    if (isEdit) {
      dispatch(fetchPlanById(id))
    } else {
      dispatch(clearSelectedPlan())
    }
  }, [dispatch, id, isEdit])

  // Prepopulate if editing
  React.useEffect(() => {
    if (isEdit && selectedPlan) {
      const p = selectedPlan
      const firstProd =
        p.products && p.products.length > 0 ? p.products[0] : null
      const prodId = firstProd?.productId?._id || firstProd?.productId?.id || firstProd?.productId || ""
      const varId = firstProd?.variantId || ""

      setFormData({
        name: p.name || "",
        description: p.description || "",
        productId: prodId,
        variantId: varId,
        price: p.price != null ? String(fromMinorUnits(p.price)) : "",
        billingInterval: p.billingInterval || "monthly",
        minimumQuantity: p.minimumQuantity || 1,
        autoCloseAtExpiry: Boolean(p.autoCloseAtExpiry),
        allowEarlyClosure: p.allowEarlyClosure !== false,
        allowPause: p.allowPause !== false,
        allowRenewal: p.allowRenewal !== false,
        availableFrom: formatDateInput(p.availableFrom),
        availableUntil: formatDateInput(p.availableUntil),
        notes: p.notes || "",
      })
    }
  }, [isEdit, selectedPlan])

  // Get variants for the selected product
  const selectedProductObj = React.useMemo(() => {
    return products.find(
      (p) => (p.id || p._id) === formData.productId
    )
  }, [products, formData.productId])

  const availableVariants = selectedProductObj?.variants || []

  // ── Validation & Submission ────────────────────────────────────────────────
  function validate() {
    const errs = {}
    if (!formData.name.trim()) errs.name = "Plan name is required"
    if (!formData.price || Number(formData.price) < 0)
      errs.price = "Valid plan price is required"
    if (!formData.minimumQuantity || Number(formData.minimumQuantity) < 1)
      errs.minimumQuantity = "Minimum quantity must be at least 1"

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const productPayload = formData.productId
      ? [
          {
            productId: formData.productId,
            variantId: formData.variantId || undefined,
            quantity: Number(formData.minimumQuantity) || 1,
          },
        ]
      : []

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      products: productPayload,
      price: toMinorUnits(formData.price),
      billingInterval: formData.billingInterval,
      minimumQuantity: Number(formData.minimumQuantity) || 1,
      availableFrom: formData.availableFrom ? new Date(formData.availableFrom).toISOString() : null,
      availableUntil: formData.availableUntil ? new Date(formData.availableUntil).toISOString() : null,
      autoCloseAtExpiry: formData.autoCloseAtExpiry,
      allowEarlyClosure: formData.allowEarlyClosure,
      allowPause: formData.allowPause,
      allowRenewal: formData.allowRenewal,
      isActive: true,
    }

    if (isEdit) {
      dispatch(updatePlan({ id, payload })).then((res) => {
        if (!res.error) navigate(`${basePath}/plans`)
      })
    } else {
      dispatch(createPlan(payload)).then((res) => {
        if (!res.error) navigate(`${basePath}/plans`)
      })
    }
  }

  if (isEdit && detailLoading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs text-muted-foreground">Loading plan details...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Link
              to={`${basePath}/plans`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Plans
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {isEdit ? "Edit" : "Create"}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            {isEdit ? "Edit Subscription Plan" : "Create Subscription Plan"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? "Update subscription plan pricing, billing and capabilities."
              : "Set up a new subscription plan with pricing, billing and capabilities."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/plans`)}
            className="rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {actionLoading && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Plan"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── 2 Column Form Layout ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Section A: Basic Information */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter plan name"
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter plan description (optional)..."
                  className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Associated Product
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value, variantId: "" })
                  }
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Pricing Configuration */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Pricing Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Plan Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    className="w-full h-10 rounded-xl border border-border/70 bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                  />
                </div>
                {formErrors.price && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Product Variant
                </label>
                <select
                  value={formData.variantId}
                  onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
                  disabled={!formData.productId || availableVariants.length === 0}
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition disabled:opacity-50"
                >
                  <option value="">Select a variant (optional)</option>
                  {availableVariants.map((v) => (
                    <option key={v.id || v._id} value={v.id || v._id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section C: Billing Configuration */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Billing Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Billing Interval <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["daily", "weekly", "monthly", "yearly"].map((interval) => {
                    const isSelected = formData.billingInterval === interval
                    return (
                      <button
                        key={interval}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, billingInterval: interval })
                        }
                        className={`h-9 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                          isSelected
                            ? "bg-[#2563EB] text-white shadow-xs"
                            : "border border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {interval}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Minimum Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                    #
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimumQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumQuantity: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-border/70 bg-background pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Subscription Capabilities & Availability */}
        <div className="lg:col-span-6 space-y-6">
          {/* Section D: Subscription Capabilities */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Subscription Capabilities
            </h2>

            <div className="divide-y divide-border/60">
              {/* Capability 1: Auto-close */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Auto-close at expiry
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically close the subscription at expiry.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoCloseAtExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, autoCloseAtExpiry: e.target.checked })
                  }
                  className="size-4 rounded text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Capability 2: Early closure */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Allow early closure
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Allow permitted users to close before expiry.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowEarlyClosure}
                  onChange={(e) =>
                    setFormData({ ...formData, allowEarlyClosure: e.target.checked })
                  }
                  className="size-4 rounded text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Capability 3: Allow pause */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Allow pause
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Allow eligible subscriptions to be paused.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowPause}
                  onChange={(e) =>
                    setFormData({ ...formData, allowPause: e.target.checked })
                  }
                  className="size-4 rounded text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Capability 4: Allow renewal */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Allow renewal
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Allow subscriptions to be renewed.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowRenewal}
                  onChange={(e) =>
                    setFormData({ ...formData, allowRenewal: e.target.checked })
                  }
                  className="size-4 rounded text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section E: Availability */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Availability
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Available From
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, availableFrom: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Available Until
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.availableUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, availableUntil: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Additional Notes
            </h2>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter internal notes (optional)..."
              className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
            />
          </div>
        </div>
      </form>
    </div>
  )
}

