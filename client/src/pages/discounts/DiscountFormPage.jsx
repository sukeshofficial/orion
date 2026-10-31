// src/pages/discounts/DiscountFormPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  createDiscount,
  updateDiscount,
  fetchDiscountById,
  clearSelectedDiscount,
} from "@/redux/Slices/discountSlice"
import { formatCurrency } from "@/lib/formatters"
import {
  ChevronLeft,
  CalendarDays,
  AlertCircle,
  Loader2,
  Percent,
  IndianRupee,
  Check,
  X,
} from "lucide-react"

// ─── Shared Input Styles ──────────────────────────────────────────────────────
const inputCls =
  "w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/60 transition"

const prefixInputCls =
  "w-full h-10 rounded-xl border border-border/70 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"

const suffixInputCls =
  "w-full h-10 rounded-xl border border-border/70 bg-background pl-3 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"

// ─── Card Wrapper ─────────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#2563EB]" />
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function Label({ required, children }) {
  return (
    <label className="text-xs font-semibold text-foreground block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 ${
        checked ? "bg-[#2563EB]" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

// ─── Main DiscountFormPage ────────────────────────────────────────────────────

export default function DiscountFormPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedDiscount, detailLoading, actionLoading, error } = useSelector(
    (state) => state.discount
  )

  // ── Form State ──────────────────────────────────────────────────────────────
  const [form, setForm] = React.useState({
    name: "",
    code: "",
    description: "",
    type: "percentage",         // "percentage" | "fixed"
    value: "",
    appliesTo: "all",           // "all" | "products" | "subscription"
    applicableProducts: [],
    minimumPurchase: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    isActive: true,
  })

  const [formErrors, setFormErrors] = React.useState({})

  // Fetch on edit mode
  React.useEffect(() => {
    if (isEdit) {
      dispatch(fetchDiscountById(id))
    } else {
      dispatch(clearSelectedDiscount())
    }
  }, [dispatch, id, isEdit])

  // Pre-fill if editing
  React.useEffect(() => {
    if (isEdit && selectedDiscount) {
      const d = selectedDiscount
      setForm({
        name: d.name || "",
        code: d.code || "",
        description: d.description || "",
        type: d.type || "percentage",
        value: d.value != null ? String(d.value) : "",
        appliesTo: d.appliesTo || "all",
        applicableProducts: d.applicableProducts || [],
        minimumPurchase: d.minimumPurchase != null ? String(d.minimumPurchase) : "",
        usageLimit: d.usageLimit != null ? String(d.usageLimit) : "",
        startDate: d.startDate ? d.startDate.split("T")[0] : "",
        endDate: d.endDate ? d.endDate.split("T")[0] : "",
        isActive: d.isActive ?? true,
      })
    }
  }, [isEdit, selectedDiscount])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = "Discount name is required."
    if (!form.code.trim()) errs.code = "Discount code is required."
    if (!form.value || Number(form.value) <= 0) errs.value = "A valid discount value is required."
    if (form.type === "percentage" && Number(form.value) > 100)
      errs.value = "Percentage must be between 0 and 100."
    if (!form.startDate) errs.startDate = "Start date is required."
    if (!form.endDate) errs.endDate = "End date is required."
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = "End date must be after start date."
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value),
      appliesTo: form.appliesTo,
      applicableProducts: form.appliesTo === "products" ? form.applicableProducts : [],
      minimumPurchase: form.minimumPurchase ? Number(form.minimumPurchase) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    }

    if (isEdit) {
      dispatch(updateDiscount({ id, payload })).then((res) => {
        if (!res.error) navigate(`${basePath}/discounts`)
      })
    } else {
      dispatch(createDiscount(payload)).then((res) => {
        if (!res.error) navigate(`${basePath}/discounts`)
      })
    }
  }

  if (isEdit && detailLoading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs text-muted-foreground">Loading discount details...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Link
              to={`${basePath}/discounts`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Discounts
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {isEdit ? "Edit" : "Create"}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            {isEdit ? "Edit Discount" : "Create Discount"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? "Update this promotional discount."
              : "Set up a new promotional discount."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/discounts`)}
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
            Save Discount
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── 2-Column Layout ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Basic Information */}
          <Card title="Basic Information">
            <div>
              <Label required>Discount Name</Label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Summer Sale 2025"
                className={inputCls}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Label required>Discount Code</Label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME50"
                className={inputCls}
              />
              {formErrors.code && (
                <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Optional description of this discount..."
                className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition resize-none"
              />
            </div>
          </Card>

          {/* Application Scope */}
          <Card title="Application Scope">
            <div>
              <Label required>Applies To</Label>
              <select
                value={form.appliesTo}
                onChange={(e) => set("appliesTo", e.target.value)}
                className={inputCls}
              >
                <option value="all">All Products</option>
                <option value="products">Specific Products</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>

            {form.appliesTo === "products" && (
              <div className="rounded-xl border border-border/70 bg-background p-4">
                <p className="text-xs font-semibold text-foreground mb-2">
                  Select applicable products
                </p>
                <p className="text-xs text-muted-foreground">
                  Product picker — connect to your product selector component here.
                </p>
              </div>
            )}
          </Card>

          {/* Validity Period */}
          <Card title="Validity Period">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required>Start Date</Label>
                <div className="relative">
                  <CalendarDays className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={`${prefixInputCls} cursor-pointer`}
                  />
                </div>
                {formErrors.startDate && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.startDate}</p>
                )}
              </div>

              <div>
                <Label required>End Date</Label>
                <div className="relative">
                  <CalendarDays className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    min={form.startDate}
                    className={`${prefixInputCls} cursor-pointer`}
                  />
                </div>
                {formErrors.endDate && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.endDate}</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Discount Configuration */}
          <Card title="Discount Configuration">
            {/* Type Radio */}
            <div>
              <Label required>Discount Type</Label>
              <div className="flex gap-3">
                {[
                  { value: "percentage", label: "Percentage" },
                  { value: "fixed", label: "Fixed Amount" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex-1 flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                      form.type === opt.value
                        ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-blue-950/30"
                        : "border-border/70 bg-background hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        form.type === opt.value
                          ? "border-[#2563EB] bg-[#2563EB]"
                          : "border-border"
                      }`}
                    >
                      {form.type === opt.value && (
                        <span className="size-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="discountType"
                      value={opt.value}
                      checked={form.type === opt.value}
                      onChange={() => set("type", opt.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Value Input */}
            <div>
              {form.type === "percentage" ? (
                <>
                  <Label required>Discount Percentage</Label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={form.value}
                      onChange={(e) => set("value", e.target.value)}
                      placeholder="0"
                      className={suffixInputCls}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a value between 0 and 100.
                  </p>
                </>
              ) : (
                <>
                  <Label required>Discount Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.value}
                      onChange={(e) => set("value", e.target.value)}
                      placeholder="0"
                      className={prefixInputCls}
                    />
                  </div>
                </>
              )}
              {formErrors.value && (
                <p className="text-xs text-red-500 mt-1">{formErrors.value}</p>
              )}
            </div>
          </Card>

          {/* Eligibility Rules */}
          <Card title="Eligibility Rules">
            <div>
              <Label>Minimum Purchase Amount</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.minimumPurchase}
                  onChange={(e) => set("minimumPurchase", e.target.value)}
                  placeholder="0"
                  className={prefixInputCls}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum order amount to apply this discount.
              </p>
            </div>

            <div>
              <Label>Usage Limit</Label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                placeholder="Unlimited"
                className={inputCls}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of times this discount can be used.
              </p>
            </div>
          </Card>

          {/* Status */}
          <Card title="Status">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enable this discount for use in quotations.
                </p>
              </div>
              <Toggle checked={form.isActive} onChange={(val) => set("isActive", val)} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              {form.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Discount is active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  Discount is inactive
                </span>
              )}
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
