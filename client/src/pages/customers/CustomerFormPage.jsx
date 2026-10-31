// src/pages/customers/CustomerFormPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useLocation, Link } from "react-router-dom"
import {
  createCustomer,
  fetchCustomerById,
  updateCustomer,
  clearSelectedCustomer,
  clearError,
} from "@/redux/Slices/customerSlice"
import { lookupUserByEmail } from "@/services/customerService"
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react"

// ─── Country list ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Singapore",
  "UAE",
  "Other",
]

/**
 * Format and extract clean original human name from username or email
 */
function formatOriginalName(name, email) {
  if (!name && !email) return ""
  let raw = (name || "").trim()

  // If no name or name is an email, use email prefix
  if (!raw || raw.includes("@")) {
    raw = (email || raw).split("@")[0] || ""
  }

  // Strip trailing digits common in usernames (e.g., prithivi.coder76 -> prithivi.coder)
  const withoutDigits = raw.replace(/[0-9]+$/g, "")
  const source = withoutDigits.trim() || raw

  // Split by whitespace, dots, underscores, hyphens and capitalize each word
  const parts = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())

  if (parts.length > 0) {
    return parts.join(" ")
  }

  return raw
}

// ─── Field Components ─────────────────────────────────────────────────────────

function Field({ label, required, error, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3 mt-0.5 shrink-0" />
          {hint}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

const INPUT_CLS =
  "w-full h-9 rounded-xl border border-border/70 bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/60 dark:bg-[#111827] dark:border-white/10 transition"

const INPUT_READONLY_CLS =
  "w-full h-9 rounded-xl border border-border/40 bg-muted/40 px-3 text-sm text-muted-foreground dark:bg-white/5 dark:border-white/5 select-none cursor-default"

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerFormPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const isEdit = Boolean(id)
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { selectedCustomer, loading, error } = useSelector((s) => s.customer)

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form, setForm] = React.useState({
    userId: "",
    email: "",
    name: "",
    companyName: "",
    phone: "",
    taxIdentificationNumber: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  })
  const [userLookup, setUserLookup] = React.useState({
    loading: false,
    user: null,
    checked: false,
    error: null,
  })
  const [fieldErrors, setFieldErrors] = React.useState({})
  const [submitError, setSubmitError] = React.useState(null)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)

  // ── Automatic User Lookup by Email (Create Mode) ────────────────────────────
  React.useEffect(() => {
    if (isEdit) return

    const trimmedEmail = (form.email || "").trim().toLowerCase()
    if (!trimmedEmail) {
      setUserLookup({ loading: false, user: null, checked: false, error: null })
      setForm((prev) => ({ ...prev, userId: "", name: "" }))
      return
    }

    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    if (!looksLikeEmail) {
      setUserLookup({ loading: false, user: null, checked: false, error: null })
      setForm((prev) => ({ ...prev, userId: "", name: "" }))
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      setUserLookup((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const res = await lookupUserByEmail(trimmedEmail)
        if (!isMounted) return

        const users = res?.users || []
        const exactMatch =
          users.find((u) => u.email?.toLowerCase() === trimmedEmail) ||
          (users.length === 1 && users[0].email?.toLowerCase() === trimmedEmail
            ? users[0]
            : null)

        if (exactMatch) {
          // Check if this user account already has an active customer profile
          try {
            const custCheck = await fetchCustomerById(exactMatch.id)
            if (custCheck?.customer && isMounted) {
              const custNum = custCheck.customer.customerNumber || "Existing Record"
              const errMsg = `A customer profile already exists for this user account (${custNum}).`
              setUserLookup({
                loading: false,
                user: exactMatch,
                checked: true,
                error: errMsg,
              })
              setFieldErrors((prev) => ({ ...prev, email: errMsg }))
              const originalName =
                exactMatch.originalName ||
                exactMatch.fullName ||
                formatOriginalName(exactMatch.name, exactMatch.email)
              setForm((prev) => ({
                ...prev,
                userId: "",
                name: originalName,
                phone: prev.phone || exactMatch.phone || "",
              }))
              return
            }
          } catch {
            // Expected 404: No customer profile exists yet, which is the desired state
          }

          if (!isMounted) return
          const originalName =
            exactMatch.originalName ||
            exactMatch.fullName ||
            formatOriginalName(exactMatch.name, exactMatch.email)

          setUserLookup({
            loading: false,
            user: { ...exactMatch, originalName },
            checked: true,
            error: null,
          })
          setFieldErrors((prev) => ({ ...prev, email: undefined }))
          setForm((prev) => ({
            ...prev,
            userId: exactMatch.id,
            name: originalName,
            phone: prev.phone || exactMatch.phone || "",
          }))
        } else {
          setUserLookup({
            loading: false,
            user: null,
            checked: true,
            error: "No user account found with this email address. Please ensure the user is registered first.",
          })
          setForm((prev) => ({ ...prev, userId: "", name: "" }))
        }
      } catch (err) {
        if (!isMounted) return
        const msg =
          err?.response?.data?.message ||
          "Failed to verify user email with the backend."
        setUserLookup({
          loading: false,
          user: null,
          checked: true,
          error: msg,
        })
        setForm((prev) => ({ ...prev, userId: "", name: "" }))
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [form.email, isEdit])

  // ── Prefill on edit ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isEdit) {
      dispatch(fetchCustomerById(id))
    }
    return () => {
      dispatch(clearError())
      dispatch(clearSelectedCustomer())
    }
  }, [dispatch, id, isEdit])

  React.useEffect(() => {
    if (isEdit && selectedCustomer && selectedCustomer.id === id) {
      const c = selectedCustomer
      setForm({
        userId: c.userId?.id ?? "",
        email: c.userId?.email ?? "",
        name: c.userId?.name ?? "",
        companyName: c.companyName ?? "",
        phone: c.phone ?? "",
        taxIdentificationNumber: c.taxIdentificationNumber ?? "",
        street: c.billingAddress?.street ?? "",
        city: c.billingAddress?.city ?? "",
        state: c.billingAddress?.state ?? "",
        country: c.billingAddress?.country ?? "",
        postalCode: c.billingAddress?.postalCode ?? "",
      })
    }
  }, [selectedCustomer, isEdit, id])

  // ── Field change ─────────────────────────────────────────────────────────────
  const setField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!isEdit) {
      const emailTrim = (form.email || "").trim()
      if (!emailTrim) {
        errs.email = "Email address is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
        errs.email = "Please enter a valid email address"
      } else if (userLookup.error) {
        errs.email = userLookup.error
      } else if (!form.userId) {
        errs.email = "No registered user account found for this email address"
      }
    }
    if (!form.companyName.trim()) errs.companyName = "Company name is required"
    if (!form.phone.trim()) errs.phone = "Phone is required"
    if (!form.street.trim()) errs.street = "Address is required"
    if (!form.city.trim()) errs.city = "City is required"
    if (!form.state.trim()) errs.state = "State is required"
    if (!form.postalCode.trim()) errs.postalCode = "Postal code is required"
    if (!form.country) errs.country = "Country is required"
    return errs
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    const billingAddress = {
      street: form.street,
      city: form.city,
      state: form.state,
      country: form.country,
      postalCode: form.postalCode,
    }

    let result
    if (isEdit) {
      result = await dispatch(
        updateCustomer({
          id,
          payload: {
            companyName: form.companyName,
            phone: form.phone,
            taxIdentificationNumber: form.taxIdentificationNumber,
            billingAddress,
          },
        })
      )
    } else {
      result = await dispatch(
        createCustomer({
          userId: form.userId,
          companyName: form.companyName,
          phone: form.phone,
          taxIdentificationNumber: form.taxIdentificationNumber,
          billingAddress,
        })
      )
    }

    if (result.meta.requestStatus === "fulfilled") {
      setSubmitSuccess(true)
      if (isEdit) {
        navigate(`${basePath}/customers/${id}`)
      } else {
        navigate(`${basePath}/customers`)
      }
    } else {
      setSubmitError(result.payload || "Something went wrong. Please try again.")
    }
  }

  // ── Derived display values for edit mode ─────────────────────────────────────
  const displayName = isEdit ? (selectedCustomer?.userId?.name ?? "—") : null
  const displayEmail = isEdit ? (selectedCustomer?.userId?.email ?? "—") : null

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Link
            to={`${basePath}/customers`}
            className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
          >
            <ChevronLeft className="size-4" />
            Customers
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {isEdit ? "Edit" : "Create"}
          </span>
        </nav>
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
          {isEdit ? "Edit Customer" : "Create Customer"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
          {isEdit
            ? "Update customer information."
            : "Add a new customer to your system."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* ── Global submit error ─────────────────────────────────────────── */}
        {submitError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {submitError}
          </div>
        )}

        {/* ── Customer Information ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
          <SectionHeading
            title="Customer Information"
            description="Basic customer and account details."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Create Mode: Email Address with live backend lookup */}
            {!isEdit && (
              <Field
                label="Email Address"
                required
                error={fieldErrors.email || userLookup.error}
                hint={
                  !userLookup.user && !userLookup.error
                    ? "Enter the email of an existing registered user account to link."
                    : undefined
                }
              >
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="e.g. alex@example.com"
                    className={`${INPUT_CLS} ${userLookup.loading ? "pr-9" : ""}`}
                    autoComplete="off"
                  />
                  {userLookup.loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Loader2 className="size-4 animate-spin text-[#2563EB]" />
                    </div>
                  )}
                  {!userLookup.loading && userLookup.user && !userLookup.error && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                      <CheckCircle2 className="size-4" />
                    </div>
                  )}
                </div>
              </Field>
            )}

            {/* Create Mode: Customer Name (Auto-populated with original name, but editable) */}
            {!isEdit && (
              <Field
                label="Customer Name"
                hint={
                  userLookup.user
                    ? "Original name fetched from user account. You can edit if needed."
                    : undefined
                }
              >
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder={
                    userLookup.user
                      ? "Enter customer name"
                      : "Auto-populated once email is verified"
                  }
                  className={INPUT_CLS}
                />
              </Field>
            )}

            {/* Create Mode: Verified User Account Banner */}
            {!isEdit && userLookup.user && !userLookup.error && (
              <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 transition-all animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {(userLookup.user.originalName || userLookup.user.name)?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-emerald-950">
                      {userLookup.user.originalName || userLookup.user.name}
                    </span>
                    <span className="text-emerald-700 ml-1.5 font-normal">
                      ({userLookup.user.email})
                    </span>
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-200/80 text-emerald-800 uppercase tracking-wider">
                      {userLookup.user.status || "active"} account
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  Account Verified & Linked
                </span>
              </div>
            )}

            {/* Edit Mode: Name — read only */}
            {isEdit && (
              <Field label="Name">
                <div className={`${INPUT_READONLY_CLS} flex items-center`}>
                  {displayName}
                </div>
              </Field>
            )}

            {/* Edit Mode: Email — read only */}
            {isEdit && (
              <Field label="Email">
                <div className={`${INPUT_READONLY_CLS} flex items-center`}>
                  {displayEmail}
                </div>
              </Field>
            )}

            {/* Company Name */}
            <Field label="Company Name" required error={fieldErrors.companyName}>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                placeholder="e.g. Acme Technologies"
                className={INPUT_CLS}
              />
            </Field>

            {/* Phone */}
            <Field label="Phone" required error={fieldErrors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+1 555 010 1234"
                className={INPUT_CLS}
              />
            </Field>

            {/* Tax ID */}
            <div className="sm:col-span-2">
              <Field label="Tax Identification Number" error={fieldErrors.taxIdentificationNumber}>
                <input
                  type="text"
                  value={form.taxIdentificationNumber}
                  onChange={(e) => setField("taxIdentificationNumber", e.target.value)}
                  placeholder="e.g. GSTIN-EXAMPLE-1234 or US123456789"
                  className={INPUT_CLS}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Billing Address ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs p-6">
          <SectionHeading
            title="Billing Address"
            description="The billing address used for invoices and payments."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Address Line 1 */}
            <Field label="Address Line 1" required error={fieldErrors.street}>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
                placeholder="e.g. 12 Market Street"
                className={INPUT_CLS}
              />
            </Field>

            {/* Address Line 2 — optional, maps to part of street */}
            <Field label="Address Line 2" error={undefined}>
              <input
                type="text"
                placeholder="Apartment, suite, unit (optional)"
                className={INPUT_CLS}
              />
            </Field>

            {/* City */}
            <Field label="City" required error={fieldErrors.city}>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="e.g. Chennai"
                className={INPUT_CLS}
              />
            </Field>

            {/* State */}
            <Field label="State / Province" required error={fieldErrors.state}>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                placeholder="e.g. Tamil Nadu"
                className={INPUT_CLS}
              />
            </Field>

            {/* Postal Code */}
            <Field label="Postal Code" required error={fieldErrors.postalCode}>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setField("postalCode", e.target.value)}
                placeholder="e.g. 600001"
                className={INPUT_CLS}
              />
            </Field>

            {/* Country */}
            <Field label="Country" required error={fieldErrors.country}>
              <select
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Form Actions ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            to={isEdit ? `${basePath}/customers/${id}` : `${basePath}/customers`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/70 bg-white text-sm font-medium text-foreground hover:bg-muted transition-colors dark:bg-[#111827] dark:border-white/10"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || (!isEdit && userLookup.loading)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {(loading || (!isEdit && userLookup.loading)) && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {isEdit ? "Save Changes" : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  )
}

