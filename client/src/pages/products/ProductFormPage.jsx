// src/pages/products/ProductFormPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  createProduct,
  updateProduct,
  fetchProductById,
  clearSelectedProduct,
} from "@/redux/Slices/productSlice"
import { fetchTaxes } from "@/redux/Slices/taxSlice"
import { toMinorUnits, fromMinorUnits } from "@/lib/formatters"
import {
  ChevronLeft,
  Plus,
  Trash2,
  HelpCircle,
  GripVertical,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react"

export default function ProductFormPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedProduct, detailLoading, actionLoading, error } = useSelector(
    (state) => state.product
  )
  const { taxes } = useSelector((state) => state.tax)

  // ── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = React.useState({
    name: "",
    type: "service",
    description: "",
    salesPrice: "",
    costPrice: "",
    taxId: "",
    notes: "",
  })

  // Dynamic Attributes State: [{ id: 1, name: "Brand", options: [{ id: 1, name: "Standard", priceAdjustment: "0" }] }]
  const [attributes, setAttributes] = React.useState([
    {
      id: "attr-1",
      name: "Brand",
      options: [
        { id: "opt-1", name: "Standard", priceAdjustment: "0" },
        { id: "opt-2", name: "Odoo", priceAdjustment: "560" },
        { id: "opt-3", name: "Enterprise", priceAdjustment: "1000" },
      ],
    },
  ])

  const [formErrors, setFormErrors] = React.useState({})

  // Fetch taxes on mount
  React.useEffect(() => {
    dispatch(fetchTaxes({ limit: 100, isActive: true }))
  }, [dispatch])

  // Fetch product if edit mode
  React.useEffect(() => {
    if (isEdit) {
      dispatch(fetchProductById(id))
    } else {
      dispatch(clearSelectedProduct())
    }
  }, [dispatch, id, isEdit])

  // Pre-fill if editing
  React.useEffect(() => {
    if (isEdit && selectedProduct) {
      const p = selectedProduct
      const matchedTaxId =
        Array.isArray(p.taxIds) && p.taxIds.length > 0
          ? typeof p.taxIds[0] === "object"
            ? p.taxIds[0]._id || p.taxIds[0].id
            : p.taxIds[0]
          : ""

      setFormData({
        name: p.name || "",
        type: p.type || "service",
        description: p.notes || "",
        salesPrice: p.salesPrice != null ? String(fromMinorUnits(p.salesPrice)) : "",
        costPrice: p.costPrice != null ? String(fromMinorUnits(p.costPrice)) : "",
        taxId: matchedTaxId,
        notes: p.notes || "",
      })

      // Reconstruct attributes if present in variants
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        // Collect distinct attribute keys from variants
        const attrKeys = new Set()
        p.variants.forEach((v) => {
          if (v.attributes) {
            const keys =
              v.attributes instanceof Map
                ? Array.from(v.attributes.keys())
                : Object.keys(v.attributes)
            keys.forEach((k) => attrKeys.add(k))
          }
        })

        if (attrKeys.size > 0) {
          const reconstructed = Array.from(attrKeys).map((key, aIdx) => {
            const seenOpts = new Set()
            const opts = []
            p.variants.forEach((v, vIdx) => {
              const val =
                v.attributes instanceof Map
                  ? v.attributes.get(key)
                  : v.attributes?.[key]
              if (val && !seenOpts.has(val)) {
                seenOpts.add(val)
                opts.push({
                  id: `opt-${vIdx}-${Math.random()}`,
                  name: val,
                  priceAdjustment: String(fromMinorUnits(v.priceAdjustment || 0)),
                })
              }
            })
            return {
              id: `attr-${aIdx}-${Math.random()}`,
              name: key.charAt(0).toUpperCase() + key.slice(1),
              options: opts.length > 0 ? opts : [{ id: "opt-default", name: "Standard", priceAdjustment: "0" }],
            }
          })
          setAttributes(reconstructed)
        } else {
          // If no specific attributes map, populate variants as a single attribute
          setAttributes([
            {
              id: "attr-default",
              name: "Option",
              options: p.variants.map((v, i) => ({
                id: `opt-${i}`,
                name: v.name || `Variant ${i + 1}`,
                priceAdjustment: String(fromMinorUnits(v.priceAdjustment || 0)),
              })),
            },
          ])
        }
      }
    }
  }, [isEdit, selectedProduct])

  // ── Handlers for attributes & options ───────────────────────────────────────

  function handleAddAttribute() {
    const newAttr = {
      id: `attr-${Date.now()}`,
      name: `Attribute ${attributes.length + 1}`,
      options: [{ id: `opt-${Date.now()}`, name: "Option 1", priceAdjustment: "0" }],
    }
    setAttributes((prev) => [...prev, newAttr])
  }

  function handleRemoveAttribute(attrId) {
    setAttributes((prev) => prev.filter((a) => a.id !== attrId))
  }

  function handleAttributeNameChange(attrId, newName) {
    setAttributes((prev) =>
      prev.map((a) => (a.id === attrId ? { ...a, name: newName } : a))
    )
  }

  function handleAddOption(attrId) {
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id === attrId) {
          return {
            ...a,
            options: [
              ...a.options,
              {
                id: `opt-${Date.now()}-${Math.random()}`,
                name: `Option ${a.options.length + 1}`,
                priceAdjustment: "0",
              },
            ],
          }
        }
        return a
      })
    )
  }

  function handleRemoveOption(attrId, optId) {
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id === attrId) {
          return {
            ...a,
            options: a.options.filter((o) => o.id !== optId),
          }
        }
        return a
      })
    )
  }

  function handleOptionChange(attrId, optId, field, val) {
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id === attrId) {
          return {
            ...a,
            options: a.options.map((o) =>
              o.id === optId ? { ...o, [field]: val } : o
            ),
          }
        }
        return a
      })
    )
  }

  // ── Cartesian Product helper for variants ──────────────────────────────────
  function generateVariants() {
    if (attributes.length === 0) return []

    // Filter attributes that have a name and at least one option with a name
    const validAttrs = attributes.filter(
      (a) => a.name.trim() && a.options.some((o) => o.name.trim())
    )

    if (validAttrs.length === 0) return []

    let combinations = [ { name: "", priceAdjustment: 0, attributes: {} } ]

    validAttrs.forEach((attr) => {
      const newCombs = []
      const validOptions = attr.options.filter((o) => o.name.trim())

      combinations.forEach((comb) => {
        validOptions.forEach((opt) => {
          const optAdj = Number(opt.priceAdjustment) || 0
          const combinedName = comb.name
            ? `${comb.name} / ${opt.name.trim()}`
            : opt.name.trim()

          newCombs.push({
            name: combinedName,
            sku: combinedName.toUpperCase().replace(/[^A-Z0-9]/g, "-"),
            priceAdjustment: toMinorUnits(comb.priceAdjustment + optAdj),
            attributes: {
              ...comb.attributes,
              [attr.name.trim().toLowerCase()]: opt.name.trim(),
            },
            isActive: true,
          })
        })
      })
      combinations = newCombs
    })

    return combinations
  }

  // ── Form Validation & Submission ───────────────────────────────────────────

  function validate() {
    const errs = {}
    if (!formData.name.trim()) errs.name = "Product name is required"
    if (!formData.salesPrice || Number(formData.salesPrice) < 0)
      errs.salesPrice = "Valid sales price is required"
    if (formData.costPrice && Number(formData.costPrice) < 0)
      errs.costPrice = "Cost price must be non-negative"

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const variants = generateVariants()
    const taxIds = formData.taxId ? [formData.taxId] : []

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      salesPrice: toMinorUnits(formData.salesPrice),
      costPrice: toMinorUnits(formData.costPrice || 0),
      notes: formData.notes || formData.description,
      taxIds,
      variants,
      isActive: true,
    }

    if (isEdit) {
      dispatch(updateProduct({ id, payload })).then((res) => {
        if (!res.error) navigate(`${basePath}/products`)
      })
    } else {
      dispatch(createProduct(payload)).then((res) => {
        if (!res.error) navigate(`${basePath}/products`)
      })
    }
  }

  if (isEdit && detailLoading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        <p className="mt-3 text-xs text-muted-foreground">Loading product details...</p>
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
              to={`${basePath}/products`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Products
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {isEdit ? "Edit" : "Create"}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            {isEdit ? "Edit Product" : "Create Product"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? "Update product details and variant configuration."
              : "Add a new product to your catalogue."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/products`)}
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
            {isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── 2 Column Grid ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Basic Information & Pricing & Tax */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                >
                  <option value="service">Service</option>
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description (optional)..."
                  className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Tax */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Pricing & Tax
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Sales Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.salesPrice}
                    onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                    placeholder="0"
                    className="w-full h-10 rounded-xl border border-border/70 bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                  />
                </div>
                {formErrors.salesPrice && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.salesPrice}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Cost Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0"
                    className="w-full h-10 rounded-xl border border-border/70 bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Tax
              </label>
              <select
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
              >
                <option value="">Select applicable tax</option>
                {taxes.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter internal notes (optional)..."
                className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
              />
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Product Variants */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#2563EB]" />
                  Product Variants
                </h2>
                <div title="Define attributes and variant price adjustments. The authoritative calculation happens on the backend.">
                  <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] border border-[#2563EB]/30 rounded-lg px-2.5 py-1.5 hover:bg-[#EFF6FF] dark:hover:bg-blue-950/40 transition cursor-pointer"
              >
                <Plus className="size-3.5" />
                Add Attribute
              </button>
            </div>

            {attributes.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border/80 rounded-xl text-muted-foreground text-xs">
                No variants configured. Click "Add Attribute" to add dynamic variant attributes.
              </div>
            ) : (
              <div className="space-y-4">
                {attributes.map((attr, aIdx) => (
                  <div
                    key={attr.id}
                    className="rounded-xl border border-border/80 bg-background p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="size-4 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Attribute {aIdx + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(attr.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Delete Attribute"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => handleAttributeNameChange(attr.id, e.target.value)}
                      placeholder="e.g. Brand, Edition, Deployment"
                      className="w-full h-9 rounded-lg border border-border/70 bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />

                    {/* Options Table */}
                    <div className="border border-border/60 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-medium">
                            <th className="px-3 py-2">Option Name</th>
                            <th className="px-3 py-2">Price Adjustment (₹)</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {attr.options.map((opt) => (
                            <tr key={opt.id}>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={opt.name}
                                  onChange={(e) =>
                                    handleOptionChange(attr.id, opt.id, "name", e.target.value)
                                  }
                                  placeholder="Option name"
                                  className="w-full h-8 rounded-md border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={opt.priceAdjustment}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      attr.id,
                                      opt.id,
                                      "priceAdjustment",
                                      e.target.value
                                    )
                                  }
                                  placeholder="0"
                                  className="w-full h-8 rounded-md border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(attr.id, opt.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAddOption(attr.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8] p-1 cursor-pointer"
                      >
                        <Plus className="size-3" />
                        Add Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

