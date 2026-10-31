// src/pages/quotations/TemplateFormPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  createQuotationTemplate,
  updateQuotationTemplate,
  fetchQuotationTemplateById,
  clearSelectedTemplate,
} from "@/redux/Slices/quotationTemplateSlice"
import { fetchPlans } from "@/redux/Slices/planSlice"
import { fetchProducts } from "@/redux/Slices/productSlice"
import {
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react"

export default function TemplateFormPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedTemplate, actionLoading, error } = useSelector(
    (state) => state.quotationTemplate
  )
  const { plans } = useSelector((state) => state.plan)
  const { products } = useSelector((state) => state.product)

  // ── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    planId: "",
    validityDays: 30,
    notes: "",
  })

  // Product lines: [{ id: 1, productId: "", variantId: "", quantity: 1 }]
  const [productLines, setProductLines] = React.useState([
    { id: "line-1", productId: "", variantId: "", quantity: 1 },
  ])

  const [formErrors, setFormErrors] = React.useState({})

  React.useEffect(() => {
    dispatch(fetchPlans({ limit: 100, isActive: true }))
    dispatch(fetchProducts({ limit: 100, isActive: true }))
  }, [dispatch])

  React.useEffect(() => {
    if (isEdit) {
      dispatch(fetchQuotationTemplateById(id))
    } else {
      dispatch(clearSelectedTemplate())
    }
  }, [dispatch, id, isEdit])

  // Pre-fill if editing
  React.useEffect(() => {
    if (isEdit && selectedTemplate) {
      const t = selectedTemplate
      const pId = t.planId?._id || t.planId?.id || t.planId || ""
      setFormData({
        name: t.name || "",
        description: t.description || "",
        planId: pId,
        validityDays: t.validityDays || 30,
        notes: t.notes || "",
      })

      if (Array.isArray(t.productLines) && t.productLines.length > 0) {
        setProductLines(
          t.productLines.map((pl, idx) => ({
            id: `line-${idx}-${Math.random()}`,
            productId: pl.productId?._id || pl.productId?.id || pl.productId || "",
            variantId: pl.variantId || "",
            quantity: pl.quantity || 1,
          }))
        )
      }
    }
  }, [isEdit, selectedTemplate])

  function handleAddLine() {
    setProductLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        productId: "",
        variantId: "",
        quantity: 1,
      },
    ])
  }

  function handleRemoveLine(lineId) {
    setProductLines((prev) => prev.filter((l) => l.id !== lineId))
  }

  function handleLineChange(lineId, field, value) {
    setProductLines((prev) =>
      prev.map((l) => {
        if (l.id === lineId) {
          if (field === "productId") {
            return { ...l, productId: value, variantId: "" }
          }
          return { ...l, [field]: value }
        }
        return l
      })
    )
  }

  function validate() {
    const errs = {}
    if (!formData.name.trim()) errs.name = "Template name is required"
    if (!formData.planId) errs.planId = "Subscription plan is required"
    if (!formData.validityDays || Number(formData.validityDays) < 1)
      errs.validityDays = "Validity must be at least 1 day"

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const validLines = productLines
      .filter((l) => l.productId)
      .map((l) => ({
        productId: l.productId,
        variantId: l.variantId || undefined,
        quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
      }))

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      planId: formData.planId,
      validityDays: parseInt(formData.validityDays, 10) || 30,
      productLines: validLines,
      isActive: true,
    }

    if (isEdit) {
      dispatch(updateQuotationTemplate({ id, payload })).then((res) => {
        if (!res.error) navigate(`${basePath}/quotation-templates`)
      })
    } else {
      dispatch(createQuotationTemplate(payload)).then((res) => {
        if (!res.error) navigate(`${basePath}/quotation-templates`)
      })
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Link
              to={`${basePath}/quotation-templates`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Quotation Templates
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {isEdit ? "Edit" : "Create"}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            {isEdit ? "Edit Quotation Template" : "Create Quotation Template"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a reusable quotation configuration with products and default quantities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/quotation-templates`)}
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
            Save Template
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── 2 Column Layout ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Basic Information
            </h2>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter template name"
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
                placeholder="Enter description (optional)..."
                className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Plan Configuration
            </h2>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Subscription Plan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
              >
                <option value="">Select a plan</option>
                {plans.map((pl) => (
                  <option key={pl.id || pl._id} value={pl.id || pl._id}>
                    {pl.name}
                  </option>
                ))}
              </select>
              {formErrors.planId && (
                <p className="text-xs text-red-500 mt-1">{formErrors.planId}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Validity Configuration
            </h2>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Validity Period (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.validityDays}
                onChange={(e) =>
                  setFormData({ ...formData, validityDays: e.target.value })
                }
                className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
              />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#2563EB]" />
                Product Configuration
              </h2>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] border border-[#2563EB]/30 rounded-lg px-2.5 py-1.5 hover:bg-[#EFF6FF] dark:hover:bg-blue-950/40 transition cursor-pointer"
              >
                <Plus className="size-3.5" />
                Add Product
              </button>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="px-3 py-2.5 w-10">#</th>
                    <th className="px-3 py-2.5">Product</th>
                    <th className="px-3 py-2.5">Variant</th>
                    <th className="px-3 py-2.5 w-24">Quantity</th>
                    <th className="px-3 py-2.5 text-right w-14">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {productLines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        No product lines configured. Click "Add Product" to attach items.
                      </td>
                    </tr>
                  ) : (
                    productLines.map((line, idx) => {
                      const selProd = products.find(
                        (p) => (p.id || p._id) === line.productId
                      )
                      const vars = selProd?.variants || []

                      return (
                        <tr key={line.id}>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              value={line.productId}
                              onChange={(e) =>
                                handleLineChange(line.id, "productId", e.target.value)
                              }
                              className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                            >
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p.id || p._id} value={p.id || p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              value={line.variantId}
                              onChange={(e) =>
                                handleLineChange(line.id, "variantId", e.target.value)
                              }
                              disabled={!line.productId || vars.length === 0}
                              className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
                            >
                              <option value="">Standard / None</option>
                              {vars.map((v) => (
                                <option key={v.id || v._id} value={v.id || v._id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) =>
                                handleLineChange(line.id, "quantity", e.target.value)
                              }
                              className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Quantity Configuration
            </h2>
            <p className="text-xs text-muted-foreground">
              Default Quantities: Set default quantities for the selected products that staff can use when building new customer quotations.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
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

