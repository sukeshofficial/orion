// src/components/admin/AddStaffModal.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { createStaff, fetchStaffList } from "@/redux/Slices/staffSlice"
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Check,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react"

const PERMISSION_GROUPS = [
  {
    name: "Customer Management",
    perms: [
      { key: "customer.read", label: "View Customers" },
      { key: "customer.create", label: "Create Customers" },
      { key: "customer.update", label: "Edit Customers" },
    ],
  },
  {
    name: "Sales & Quotations",
    perms: [
      { key: "quotation.read", label: "View Quotations" },
      { key: "quotation.create", label: "Draft Quotations" },
      { key: "quotation.update", label: "Edit Quotations" },
    ],
  },
  {
    name: "Subscriptions",
    perms: [
      { key: "subscription.read", label: "View Subscriptions" },
      { key: "subscription.create", label: "Create Subscriptions" },
      { key: "subscription.update", label: "Lifecycle Actions (Pause/Close/Renew)" },
    ],
  },
  {
    name: "Catalog & Pricing",
    perms: [
      { key: "product.read", label: "View Products" },
      { key: "product.create", label: "Manage Products" },
      { key: "plan.read", label: "View Plans" },
      { key: "plan.create", label: "Manage Plans" },
      { key: "tax.read", label: "View Taxes" },
      { key: "discount.read", label: "View Discounts" },
    ],
  },
  {
    name: "Billing & Invoices",
    perms: [
      { key: "invoice.read", label: "View Invoices" },
      { key: "invoice.create", label: "Generate Invoices" },
      { key: "payment.read", label: "View Payments" },
      { key: "payment.create", label: "Record Payments" },
    ],
  },
  {
    name: "Reports & Analytics",
    perms: [
      { key: "analytics.read", label: "Financial Analytics Access" },
    ],
  },
]

export default function AddStaffModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const { actionLoading } = useSelector((state) => state.staff)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [selectedPermissions, setSelectedPermissions] = React.useState([
    "quotation.read",
    "quotation.create",
    "subscription.read",
    "invoice.read",
    "payment.read",
  ])
  const [errorMsg, setErrorMsg] = React.useState("")

  if (!isOpen) return null

  const togglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const toggleGroup = (group) => {
    const groupKeys = group.perms.map((p) => p.key)
    const allSelected = groupKeys.every((k) => selectedPermissions.includes(k))

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !groupKeys.includes(k)))
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupKeys])))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMsg("All fields are required.")
      return
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.")
      return
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      permissions: selectedPermissions,
    }

    const res = await dispatch(createStaff(payload))
    if (!res.error) {
      dispatch(fetchStaffList({}))
      if (onSuccess) onSuccess(res.payload)
      onClose()
    } else {
      setErrorMsg(typeof res.payload === "string" ? res.payload : "Failed to create staff member.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Add Staff Member
              </h2>
              <p className="text-xs text-slate-500">
                Provision a new internal staff member and assign operational permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Basic Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="jane.doe@orion.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="+1 555 019 8877"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Initial Password * (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Role Pill */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Assigned Role: Internal Staff
              </span>
              <span className="text-[11px] text-slate-500">
                Grants access to the staff portal shell and operational workflows.
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-blue-600 text-white">
              internal_user
            </span>
          </div>

          {/* Grouped Permission Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Operational Permissions ({selectedPermissions.length} selected)
              </label>
            </div>

            <div className="space-y-3">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.perms.map((p) => p.key)
                const allSelected = groupKeys.every((k) => selectedPermissions.includes(k))
                const someSelected = groupKeys.some((k) => selectedPermissions.includes(k))

                return (
                  <div
                    key={group.name}
                    className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {group.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.perms.map((perm) => {
                        const checked = selectedPermissions.includes(perm.key)
                        return (
                          <label
                            key={perm.key}
                            onClick={() => togglePermission(perm.key)}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                              checked
                                ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="size-3.5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>{perm.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer inside form */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              {actionLoading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Create Staff Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

