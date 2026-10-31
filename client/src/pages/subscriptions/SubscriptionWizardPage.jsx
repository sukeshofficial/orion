// src/pages/subscriptions/SubscriptionWizardPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { createSubscription } from "@/redux/Slices/subscriptionSlice"
import { fetchCustomers } from "@/redux/Slices/customerSlice"
import { fetchQuotations } from "@/redux/Slices/quotationSlice"
import { fetchPlans } from "@/redux/Slices/planSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Boxes,
  Calendar,
  CreditCard,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"

const STEPS = [
  { step: 1, label: "Customer", subtitle: "Select customer" },
  { step: 2, label: "Quotation", subtitle: "Choose an eligible quotation" },
  { step: 3, label: "Plan & Products", subtitle: "Review and configure" },
  { step: 4, label: "Billing Details", subtitle: "Set payment terms" },
  { step: 5, label: "Review", subtitle: "Confirm and create" },
]

export default function SubscriptionWizardPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { customers, loading: customersLoading } = useSelector((state) => state.customer)
  const { quotations, loading: quotationsLoading } = useSelector((state) => state.quotation)
  const { plans } = useSelector((state) => state.plan)
  const { actionLoading, error } = useSelector((state) => state.subscription)

  const [currentStep, setCurrentStep] = React.useState(1)

  // Step 1: Customer
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("")
  const [customerSearch, setCustomerSearch] = React.useState("")

  // Step 2: Quotation
  const [selectedQuotationId, setSelectedQuotationId] = React.useState("")
  const [quotationSearch, setQuotationSearch] = React.useState("")

  // Step 3: Plan & Products
  const [selectedPlanId, setSelectedPlanId] = React.useState("")
  const [lines, setLines] = React.useState([])
  const [billingInterval, setBillingInterval] = React.useState("Monthly")

  // Step 4: Billing Details
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [expiryDate, setExpiryDate] = React.useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [paymentTerms, setPaymentTerms] = React.useState("Net 30")
  const [autoRenew, setAutoRenew] = React.useState(true)
  const [allowPause, setAllowPause] = React.useState(true)
  const [allowEarlyClosure, setAllowEarlyClosure] = React.useState(true)

  // Feedback state
  const [validationError, setValidationError] = React.useState("")

  React.useEffect(() => {
    dispatch(fetchCustomers({ limit: 100 }))
    dispatch(fetchQuotations({ limit: 100 }))
    dispatch(fetchPlans({ limit: 100 }))
  }, [dispatch])

  // Customer selected object
  const selectedCustomer = React.useMemo(() => {
    return customers?.find((c) => (c._id || c.id) === selectedCustomerId) || null
  }, [customers, selectedCustomerId])

  // Quotations for the selected customer
  const eligibleQuotations = React.useMemo(() => {
    if (!quotations) return []
    return quotations.filter((q) => {
      const qCustId = q.customer?._id || q.customer?.id || q.customer || q.customerId
      const matchesCustomer = !selectedCustomerId || qCustId === selectedCustomerId
      return matchesCustomer
    })
  }, [quotations, selectedCustomerId])

  // When quotation is selected in Step 2, prefill plan, products, payment details
  const selectedQuotation = React.useMemo(() => {
    return eligibleQuotations.find((q) => (q._id || q.id) === selectedQuotationId) || null
  }, [eligibleQuotations, selectedQuotationId])

  React.useEffect(() => {
    if (selectedQuotation) {
      if (selectedQuotation.plan) {
        const pId = selectedQuotation.plan._id || selectedQuotation.plan.id || selectedQuotation.plan
        setSelectedPlanId(pId)
        const matchedPlan = plans?.find((p) => (p._id || p.id) === pId)
        if (matchedPlan?.billingInterval) {
          setBillingInterval(matchedPlan.billingInterval)
        }
      }
      if (Array.isArray(selectedQuotation.lines) && selectedQuotation.lines.length > 0) {
        setLines(selectedQuotation.lines)
      }
      if (selectedQuotation.paymentTerms) {
        setPaymentTerms(selectedQuotation.paymentTerms)
      }
    }
  }, [selectedQuotation, plans])

  // Selected plan object
  const selectedPlan = React.useMemo(() => {
    return plans?.find((p) => (p._id || p.id) === selectedPlanId) || null
  }, [plans, selectedPlanId])

  // Step 1 Filtered Customers
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return []
    if (!customerSearch.trim()) return customers
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    )
  }, [customers, customerSearch])

  // Step 2 Filtered Quotations
  const filteredQuotations = React.useMemo(() => {
    if (!quotationSearch.trim()) return eligibleQuotations
    const q = quotationSearch.toLowerCase()
    return eligibleQuotations.filter(
      (qt) =>
        qt.quotationNumber?.toLowerCase().includes(q) ||
        qt.status?.toLowerCase().includes(q)
    )
  }, [eligibleQuotations, quotationSearch])

  // Totals Calculation
  const subtotal = React.useMemo(() => {
    if (selectedQuotation?.subtotal !== undefined) return selectedQuotation.subtotal
    if (selectedPlan?.price) return selectedPlan.price
    return lines.reduce((acc, l) => acc + (Number(l.price || l.unitPrice || 0) * Number(l.quantity || 1)), 0)
  }, [selectedQuotation, selectedPlan, lines])

  const totalAmount = React.useMemo(() => {
    if (selectedQuotation?.total !== undefined) return selectedQuotation.total
    return subtotal
  }, [selectedQuotation, subtotal])

  // Step validation
  const validateStep = (step) => {
    setValidationError("")
    if (step === 1) {
      if (!selectedCustomerId) {
        setValidationError("Please select a customer to proceed.")
        return false
      }
    }
    if (step === 2) {
      if (!selectedQuotationId && !selectedPlanId) {
        setValidationError("Please select a quotation or continue with plan setup.")
        return false
      }
    }
    if (step === 3) {
      if (!selectedPlanId) {
        setValidationError("Please select a subscription plan.")
        return false
      }
    }
    if (step === 4) {
      if (!startDate) {
        setValidationError("Start date is required.")
        return false
      }
      if (!expiryDate) {
        setValidationError("Expiry date is required.")
        return false
      }
      if (new Date(expiryDate) <= new Date(startDate)) {
        setValidationError("Expiry date must be after start date.")
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const handleBack = () => {
    setValidationError("")
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    const payload = {
      customerId: selectedCustomerId,
      quotationId: selectedQuotationId || undefined,
      planId: selectedPlanId,
      billingInterval,
      startDate,
      expiryDate,
      paymentTerms,
      autoRenew,
      allowPause,
      allowEarlyClosure,
      totalAmount,
      lines: lines.map((l) => ({
        product: l.product?._id || l.product?.id || l.product,
        variant: l.variant?._id || l.variant?.id || l.variant || undefined,
        quantity: l.quantity || 1,
        unitPrice: l.unitPrice || l.price || 0,
        subtotal: (l.quantity || 1) * (l.unitPrice || l.price || 0),
      })),
    }

    const res = await dispatch(createSubscription(payload))
    if (!res.error) {
      navigate(`${basePath}/subscriptions`)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link to={`${basePath}/subscriptions`} className="hover:text-blue-600">
              Subscriptions
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Create Subscription</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Subscription — 5 Step Wizard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create a new subscription from an eligible quotation or direct plan.
          </p>
        </div>
        <Link
          to={`${basePath}/subscriptions`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
        >
          Cancel
        </Link>
      </div>

      {/* Stepper Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] relative">
          {STEPS.map((s, idx) => {
            const isActive = currentStep === s.step
            const isCompleted = currentStep > s.step

            return (
              <React.Fragment key={s.step}>
                <div
                  onClick={() => {
                    if (s.step < currentStep) setCurrentStep(s.step)
                  }}
                  className={`flex items-center gap-3 cursor-pointer group ${
                    s.step < currentStep ? "opacity-90" : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : s.step}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-medium leading-none ${
                        isActive
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : isCompleted
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{s.subtitle}</div>
                  </div>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > s.step ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Error message */}
      {(validationError || error) && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{validationError || (typeof error === "string" ? error : "An error occurred")}</span>
        </div>
      )}

      {/* STEP 1: SELECT CUSTOMER */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select Customer</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Search and select an existing customer for this subscription.
            </p>

            <div className="relative mt-4 mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer by name, email or company..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {customersLoading && (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading customers...
                </div>
              )}
              {!customersLoading && filteredCustomers.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No customers found matching search.
                </div>
              )}
              {filteredCustomers.map((cust) => {
                const cId = cust._id || cust.id
                const isSelected = selectedCustomerId === cId
                const initials = (cust.name || "CU")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <div
                    key={cId}
                    onClick={() => setSelectedCustomerId(cId)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-900 dark:text-white">
                          {cust.name}
                        </div>
                        <div className="text-xs text-slate-500">{cust.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                          Selected
                        </span>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Customer Details Preview Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Customer Details
              </h2>
              {selectedCustomer ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Customer Name</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCustomer.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Email</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCustomer.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Phone</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCustomer.phone || "+1 555 010 1234"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Company</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCustomer.company || selectedCustomer.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Tax Identification Number</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCustomer.taxId || "US123456789"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Billing Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCustomer.address
                        ? `${selectedCustomer.address.street || ""}, ${
                            selectedCustomer.address.city || ""
                          }, ${selectedCustomer.address.country || ""}`
                        : "123 Business Park Drive, San Francisco, CA 94107, United States"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-sm">
                  <User className="w-10 h-10 mx-auto mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
                  Select a customer from the list to view their billing details.
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedCustomerId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE QUOTATION */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Choose an Eligible Quotation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an accepted or approved quotation to base this subscription on, or configure from plan.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotation..."
                value={quotationSearch}
                onChange={(e) => setQuotationSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredQuotations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No quotations found for this customer.
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  You can proceed by manually choosing a subscription plan in Step 3.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuotationId("")
                    setCurrentStep(3)
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg"
                >
                  Configure Plan Directly →
                </button>
              </div>
            ) : (
              filteredQuotations.map((qt) => {
                const qId = qt._id || qt.id
                const isSelected = selectedQuotationId === qId
                const planName = qt.plan?.name || "Standard Plan"

                return (
                  <div
                    key={qId}
                    onClick={() => setSelectedQuotationId(qId)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border cursor-pointer transition gap-4 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {qt.quotationNumber || `QUO-${qId.slice(-4)}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${
                              qt.status === "accepted" || qt.status === "Approved"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                            }`}
                          >
                            {qt.status || "Draft"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Plan: <span className="font-medium text-slate-700 dark:text-slate-300">{planName}</span>
                          {" · "}Total: {formatCurrency(qt.total || 0)}
                          {" · "}Created: {formatDate(qt.createdAt || qt.date)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {isSelected ? (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                          Selected
                        </span>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PLAN & PRODUCTS */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Plan & Products Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or confirm the subscription plan and its included products.
            </p>
          </div>

          {/* Select Plan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Subscription Plan *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans?.map((p) => {
                const pId = p._id || p.id
                const isSelected = selectedPlanId === pId
                return (
                  <div
                    key={pId}
                    onClick={() => {
                      setSelectedPlanId(pId)
                      if (p.billingInterval) setBillingInterval(p.billingInterval)
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {p.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 stroke-[3]" />}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.price || 0)}
                      </span>
                      <span className="text-xs text-slate-400">/{p.billingInterval || "mo"}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Billing Frequency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Billing Interval
            </label>
            <div className="grid grid-cols-4 gap-3 max-w-md">
              {["Daily", "Weekly", "Monthly", "Yearly"].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setBillingInterval(interval)}
                  className={`py-2 text-xs font-medium rounded-lg border text-center transition ${
                    billingInterval.toLowerCase() === interval.toLowerCase()
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          {/* Included Products summary */}
          {lines.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Included Products from Quotation
              </div>
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Variant</th>
                    <th className="px-4 py-2.5 text-right">Quantity</th>
                    <th className="px-4 py-2.5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                        {l.product?.name || l.name || "Product"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {l.variant?.name || l.variant || "Standard"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{l.quantity || 1}</td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatCurrency(l.unitPrice || l.price || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedPlanId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: BILLING DETAILS */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Billing Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set subscription dates, payment terms and lifecycle rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Expiry Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Immediate">Immediate / Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Billing Cycle
              </label>
              <input
                type="text"
                disabled
                value={billingInterval}
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Lifecycle Switches */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lifecycle Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Auto-renew at expiry
                  </div>
                  <div className="text-[11px] text-slate-400">Renew subscription automatically</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={allowPause}
                  onChange={(e) => setAllowPause(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Allow pause
                  </div>
                  <div className="text-[11px] text-slate-400">Permit customer to pause service</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={allowEarlyClosure}
                  onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Allow early closure
                  </div>
                  <div className="text-[11px] text-slate-400">Allow cancellation before expiry</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & CONFIRM */}
      {currentStep === 5 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Review & Confirm</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all subscription parameters before activating or saving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Information
              </h3>
              <div className="text-sm">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {selectedCustomer?.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedCustomer?.email}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedCustomer?.company || selectedCustomer?.name}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Plan & Schedule
              </h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Plan:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedPlan?.name || "Standard Plan"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Interval:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {billingInterval}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Duration:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {startDate} → {expiryDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Payment Terms:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{paymentTerms}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Subscription Total Amount</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              Billed per {billingInterval.toLowerCase()}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50 shadow-sm"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Subscription...</span>
                </>
              ) : (
                <span>Confirm and Create Subscription</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

