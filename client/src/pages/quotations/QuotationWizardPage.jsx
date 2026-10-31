// src/pages/quotations/QuotationWizardPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { createQuotation } from "@/redux/Slices/quotationSlice"
import { fetchCustomers } from "@/redux/Slices/customerSlice"
import { fetchPlans } from "@/redux/Slices/planSlice"
import { fetchProducts } from "@/redux/Slices/productSlice"
import { fetchQuotationTemplates } from "@/redux/Slices/quotationTemplateSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ChevronLeft,
  Search,
  Check,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Boxes,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  AlertCircle,
  Loader2,
} from "lucide-react"

const STEPS = [
  { step: 1, label: "Customer", subtitle: "Select customer" },
  { step: 2, label: "Plan & Template", subtitle: "Choose plan or template" },
  { step: 3, label: "Product Lines", subtitle: "Add products & quantities" },
  { step: 4, label: "Payment Details", subtitle: "Set payment terms" },
  { step: 5, label: "Review", subtitle: "Confirm & create" },
]

export default function QuotationWizardPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { customers } = useSelector((state) => state.customer)
  const { plans } = useSelector((state) => state.plan)
  const { products } = useSelector((state) => state.product)
  const { templates } = useSelector((state) => state.quotationTemplate)
  const { actionLoading, error } = useSelector((state) => state.quotation)

  const [currentStep, setCurrentStep] = React.useState(1)

  // ── Wizard State ───────────────────────────────────────────────────────────
  // Step 1: Customer
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("")
  const [customerSearch, setCustomerSearch] = React.useState("")

  // Step 2: Plan & Template
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("")
  const [selectedPlanId, setSelectedPlanId] = React.useState("")

  // Step 3: Product Lines [{ id, productId, variantId, quantity }]
  const [lines, setLines] = React.useState([])

  // Step 4: Payment Details
  const [paymentTerms, setPaymentTerms] = React.useState("immediate")
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [validityDays, setValidityDays] = React.useState(30)
  const [expiryDate, setExpiryDate] = React.useState("")

  // Validation errors
  const [stepError, setStepError] = React.useState("")

  // Fetch initial collections
  React.useEffect(() => {
    dispatch(fetchCustomers({ limit: 100, status: "active" }))
    dispatch(fetchPlans({ limit: 100, isActive: true }))
    dispatch(fetchProducts({ limit: 100, isActive: true }))
    dispatch(fetchQuotationTemplates({ limit: 100, isActive: true }))
  }, [dispatch])

  // Update expiry date when startDate or validityDays change
  React.useEffect(() => {
    if (startDate) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + Number(validityDays || 30))
      setExpiryDate(d.toISOString().split("T")[0])
    }
  }, [startDate, validityDays])

  // Handle template selection auto-fill
  function handleSelectTemplate(tplId) {
    setSelectedTemplateId(tplId)
    if (!tplId) return

    const tpl = templates.find((t) => (t.id || t._id) === tplId)
    if (tpl) {
      const plId = tpl.planId?._id || tpl.planId?.id || tpl.planId
      if (plId) setSelectedPlanId(plId)
      if (tpl.validityDays) setValidityDays(tpl.validityDays)

      if (Array.isArray(tpl.productLines) && tpl.productLines.length > 0) {
        setLines(
          tpl.productLines.map((pl, idx) => ({
            id: `line-${idx}-${Math.random()}`,
            productId: pl.productId?._id || pl.productId?.id || pl.productId,
            variantId: pl.variantId || "",
            quantity: pl.quantity || 1,
          }))
        )
      }
    }
  }

  // ── Selected Customer Details ──────────────────────────────────────────────
  const selectedCustomer = React.useMemo(() => {
    return customers.find((c) => (c.id || c._id) === selectedCustomerId)
  }, [customers, selectedCustomerId])

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch.trim()) return customers
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        c.companyName?.toLowerCase().includes(q) ||
        c.userId?.name?.toLowerCase().includes(q) ||
        c.userId?.email?.toLowerCase().includes(q) ||
        c.customerNumber?.toLowerCase().includes(q)
    )
  }, [customers, customerSearch])

  // Selected Plan Object
  const selectedPlan = React.useMemo(() => {
    return plans.find((p) => (p.id || p._id) === selectedPlanId)
  }, [plans, selectedPlanId])

  // ── Step Navigation Handlers ───────────────────────────────────────────────
  function handleNext() {
    setStepError("")

    if (currentStep === 1) {
      if (!selectedCustomerId) {
        setStepError("Please select a customer to proceed.")
        return
      }
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      if (!selectedPlanId) {
        setStepError("Please select a subscription plan.")
        return
      }
      // If lines empty, seed from plan's products or 1 empty line
      if (lines.length === 0) {
        if (selectedPlan?.products?.length > 0) {
          setLines(
            selectedPlan.products.map((p, i) => ({
              id: `line-${i}-${Math.random()}`,
              productId: p.productId?._id || p.productId?.id || p.productId,
              variantId: p.variantId || "",
              quantity: p.quantity || 1,
            }))
          )
        } else {
          setLines([{ id: "line-default", productId: "", variantId: "", quantity: 1 }])
        }
      }
      setCurrentStep(3)
      return
    }

    if (currentStep === 3) {
      const validLines = lines.filter((l) => l.productId)
      if (validLines.length === 0) {
        setStepError("Please configure at least one product line.")
        return
      }
      setCurrentStep(4)
      return
    }

    if (currentStep === 4) {
      setCurrentStep(5)
      return
    }
  }

  function handleBack() {
    setStepError("")
    if (currentStep > 1) {
      setCurrentStep((c) => c - 1)
    } else {
      navigate(`${basePath}/quotations`)
    }
  }

  // ── Product Line helpers ───────────────────────────────────────────────────
  function handleAddLine() {
    setLines((prev) => [
      ...prev,
      { id: `line-${Date.now()}`, productId: "", variantId: "", quantity: 1 },
    ])
  }

  function handleRemoveLine(lineId) {
    setLines((prev) => prev.filter((l) => l.id !== lineId))
  }

  function handleLineChange(lineId, field, val) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id === lineId) {
          if (field === "productId") {
            return { ...l, productId: val, variantId: "" }
          }
          return { ...l, [field]: val }
        }
        return l
      })
    )
  }

  // Calculate estimated totals for preview (final calculation done authoritatively by backend)
  const estimatedPricing = React.useMemo(() => {
    let subtotal = 0
    let taxTotal = 0

    lines.forEach((line) => {
      if (!line.productId) return
      const prod = products.find((p) => (p.id || p._id) === line.productId)
      if (!prod) return

      let unitPrice = prod.salesPrice || 0
      if (line.variantId && Array.isArray(prod.variants)) {
        const v = prod.variants.find((vr) => (vr.id || vr._id) === line.variantId)
        if (v) unitPrice += v.priceAdjustment || 0
      }

      const qty = Math.max(1, parseInt(line.quantity, 10) || 1)
      const lineTaxable = unitPrice * qty
      subtotal += lineTaxable

      let lineTaxRate = 0
      if (Array.isArray(prod.taxIds)) {
        prod.taxIds.forEach((t) => {
          if (typeof t === "object" && t?.rate) {
            lineTaxRate += Number(t.rate)
          }
        })
      }
      taxTotal += Math.round((lineTaxable * lineTaxRate) / 100)
    })

    return {
      subtotal,
      taxTotal,
      grandTotal: subtotal + taxTotal,
    }
  }, [lines, products])

  // ── Final Submission ───────────────────────────────────────────────────────
  function handleCreateQuotation() {
    const validLines = lines
      .filter((l) => l.productId)
      .map((l) => ({
        productId: l.productId,
        variantId: l.variantId || undefined,
        quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
      }))

    const payload = {
      customerId: selectedCustomerId,
      templateId: selectedTemplateId || undefined,
      planId: selectedPlanId,
      lines: validLines,
      startDate: new Date(startDate).toISOString(),
      expiryDate: new Date(expiryDate).toISOString(),
      paymentTerms,
    }

    dispatch(createQuotation(payload)).then((res) => {
      if (!res.error) {
        navigate(`${basePath}/quotations`)
      }
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Link
              to={`${basePath}/quotations`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Quotations
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Create Quotation</span>
          </nav>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            Create Quotation — 5 Step Wizard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guided flow to configure customer, subscription plan, product lines and pricing.
          </p>
        </div>
      </div>

      {/* ── Stepper Header ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between relative">
          {/* Connector Line behind steps */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-border/60 -z-0" />

          {STEPS.map((s) => {
            const isCompleted = currentStep > s.step
            const isCurrent = currentStep === s.step
            return (
              <div key={s.step} className="flex flex-col items-center relative z-10">
                <div
                  className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20"
                      : "bg-card border-2 border-border/80 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="size-5" /> : s.step}
                </div>
                <p
                  className={`text-xs font-semibold mt-2 ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  {s.subtitle}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {stepError && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {stepError}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── STEP 1: SELECT CUSTOMER ── */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Customer List & Search (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Select Customer</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search and select an existing customer for this quotation.
              </p>
            </div>

            <div className="relative">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer by name, email or company..."
                className="w-full h-10 rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
              />
            </div>

            <div className="divide-y divide-border/60 max-h-[380px] overflow-y-auto rounded-xl border border-border/60">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No customers found matching your search.
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const id = c.id || c._id
                  const isSelected = selectedCustomerId === id
                  const name = c.companyName || c.userId?.name || "Customer"
                  const email = c.userId?.email || "—"
                  const initials = name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <div
                      key={id}
                      onClick={() => setSelectedCustomerId(id)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? "bg-[#EFF6FF] dark:bg-blue-950/40"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCustomerId(id)
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-[#2563EB] text-white shadow-xs"
                            : "border border-border/70 bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right: Customer Details Preview (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Customer Details
            </h2>

            {selectedCustomer ? (
              <div className="space-y-3 text-xs divide-y divide-border/60">
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Customer Name</span>
                  <span className="font-semibold text-foreground">
                    {selectedCustomer.companyName || selectedCustomer.userId?.name}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">
                    {selectedCustomer.userId?.email || "—"}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground">
                    {selectedCustomer.phone || "—"}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="text-foreground">
                    {selectedCustomer.companyName || "—"}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Tax Identification Number</span>
                  <span className="text-foreground font-mono">
                    {selectedCustomer.taxIdentificationNumber || "—"}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Billing Address</span>
                  <span className="text-foreground text-right max-w-[200px]">
                    {selectedCustomer.billingAddress?.street ? (
                      <>
                        {selectedCustomer.billingAddress.street},{" "}
                        {selectedCustomer.billingAddress.city},{" "}
                        {selectedCustomer.billingAddress.state},{" "}
                        {selectedCustomer.billingAddress.postalCode},{" "}
                        {selectedCustomer.billingAddress.country}
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-xl">
                Select a customer from the left to view complete account and billing details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: PLAN & TEMPLATE ── */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Start from Quotation Template (Optional)
            </h2>
            <p className="text-xs text-muted-foreground">
              Select a reusable template to auto-fill products and configuration.
            </p>

            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
            >
              <option value="">No template (configure custom quotation)</option>
              {templates.map((tpl) => (
                <option key={tpl.id || tpl._id} value={tpl.id || tpl._id}>
                  {tpl.name} ({tpl.planId?.name || "Plan"})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Subscription Plan <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Choose the primary subscription plan for this quotation.
            </p>

            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
            >
              <option value="">Select a subscription plan</option>
              {plans.map((pl) => (
                <option key={pl.id || pl._id} value={pl.id || pl._id}>
                  {pl.name} — {formatCurrency(pl.price)} / {pl.billingInterval}
                </option>
              ))}
            </select>

            {selectedPlan && (
              <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                <p className="font-semibold text-foreground">{selectedPlan.name}</p>
                <p className="text-muted-foreground">{selectedPlan.description}</p>
                <div className="flex items-center gap-4 pt-1 font-medium text-foreground">
                  <span>Price: {formatCurrency(selectedPlan.price)}</span>
                  <span>Interval: {selectedPlan.billingInterval}</span>
                  <span>Min Qty: {selectedPlan.minimumQuantity}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: PRODUCT LINES ── */}
      {currentStep === 3 && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Configure Product Lines</h2>
              <p className="text-xs text-muted-foreground">
                Add products, choose dynamic variants, and set line quantities.
              </p>
            </div>
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
                  <th className="px-3 py-2.5">Unit Price</th>
                  <th className="px-3 py-2.5 text-right w-14">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {lines.map((line, idx) => {
                  const selProd = products.find((p) => (p.id || p._id) === line.productId)
                  const vars = selProd?.variants || []
                  let unitPrice = selProd?.salesPrice || 0
                  if (line.variantId && vars.length > 0) {
                    const vr = vars.find((v) => (v.id || v._id) === line.variantId)
                    if (vr) unitPrice += vr.priceAdjustment || 0
                  }

                  return (
                    <tr key={line.id}>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <select
                          value={line.productId}
                          onChange={(e) => handleLineChange(line.id, "productId", e.target.value)}
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
                          onChange={(e) => handleLineChange(line.id, "variantId", e.target.value)}
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
                          onChange={(e) => handleLineChange(line.id, "quantity", e.target.value)}
                          className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {selProd ? formatCurrency(unitPrice) : "—"}
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STEP 4: PAYMENT DETAILS ── */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Payment Terms
            </h2>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
              >
                <option value="immediate">Immediate</option>
                <option value="net_15">Net 15 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_60">Net 60 Days</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2563EB]" />
              Validity Period & Dates
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Validity (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Calculated Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-10 rounded-xl border border-border/70 bg-muted/40 px-3 text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: REVIEW QUOTATION ── */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Customer Details
              </h2>
              <div className="text-xs space-y-1.5">
                <p className="text-base font-bold text-foreground">
                  {selectedCustomer?.companyName || selectedCustomer?.userId?.name}
                </p>
                <p className="text-muted-foreground">{selectedCustomer?.userId?.email}</p>
                <p className="text-muted-foreground">{selectedCustomer?.phone}</p>
                <p className="text-muted-foreground font-mono">
                  Tax ID: {selectedCustomer?.taxIdentificationNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Plan & Validity
              </h2>
              <div className="text-xs space-y-1.5">
                <p className="text-base font-bold text-foreground">{selectedPlan?.name}</p>
                <p className="text-muted-foreground">Billing Interval: {selectedPlan?.billingInterval}</p>
                <p className="text-muted-foreground">Payment Terms: {paymentTerms.toUpperCase()}</p>
                <p className="text-muted-foreground">
                  Valid from {formatDate(startDate)} to {formatDate(expiryDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground">Configured Product Lines</h2>
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Variant</th>
                    <th className="px-4 py-2.5">Quantity</th>
                    <th className="px-4 py-2.5">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {lines.map((l, i) => {
                    const prod = products.find((p) => (p.id || p._id) === l.productId)
                    let uPrice = prod?.salesPrice || 0
                    if (l.variantId && Array.isArray(prod?.variants)) {
                      const vr = prod.variants.find((v) => (v.id || v._id) === l.variantId)
                      if (vr) uPrice += vr.priceAdjustment || 0
                    }
                    const lTotal = uPrice * (Number(l.quantity) || 1)
                    return (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-medium text-foreground">{prod?.name || "Product"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{l.variantId ? "Configured" : "Standard"}</td>
                        <td className="px-4 py-2.5 text-foreground">{l.quantity}</td>
                        <td className="px-4 py-2.5 text-foreground">{formatCurrency(uPrice)}</td>
                        <td className="px-4 py-2.5 font-semibold text-foreground text-right">{formatCurrency(lTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Estimated Pricing Breakdown */}
            <div className="border-t border-border/60 pt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(estimatedPricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Taxes</span>
                  <span className="font-medium text-foreground">{formatCurrency(estimatedPricing.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-border/60 pt-2 text-foreground">
                  <span>Grand Total</span>
                  <span className="text-[#2563EB] text-base">{formatCurrency(estimatedPricing.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Wizard Footer Buttons ── */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition cursor-pointer"
        >
          {currentStep === 1 ? "Cancel" : "Back"}
        </button>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-xl bg-[#2563EB] px-6 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] transition cursor-pointer"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreateQuotation}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] disabled:opacity-50 transition cursor-pointer"
          >
            {actionLoading && <Loader2 className="size-4 animate-spin" />}
            Confirm & Create Quotation
          </button>
        )}
      </div>
    </div>
  )
}

