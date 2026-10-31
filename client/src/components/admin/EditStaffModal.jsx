// src/components/admin/EditStaffModal.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { updateStaff, fetchStaffList } from "@/redux/Slices/staffSlice"
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Loader2,
  AlertCircle,
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
      { key: "subscription.update", label: "Lifecycle Actions" },
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

export default function EditStaffModal({ isOpen, onClose, staff, onSuccess }) {
  const dispatch = useDispatch()
  const { actionLoading } = useSelector((state) => state.staff)

  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [status, setStatus] = React.useState("active")
  const [selectedPermissions, setSelectedPermissions] = React.useState([])
  const [errorMsg, setErrorMsg] = React.useState("")

  React.useEffect(() => {
    if (staff) {
      setName(staff.name || "")
      setPhone(staff.phone || "")
      setStatus(staff.status || "active")
      setSelectedPermissions(staff.permissions || [])
    }
  }, [staff])

  if (!isOpen || !staff) return null

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

    const id = staff._id || staff.id
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      status,
      permissions: selectedPermissions,
    }

    const res = await dispatch(updateStaff({ id, updates: payload }))
    if (!res.error) {
      dispatch(fetchStaffList({}))
      if (onSuccess) onSuccess()
      onClose()
    } else {
      setErrorMsg(typeof res.payload === "string" ? res.payload : "Failed to update staff member.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Staff Member
              </h2>
              <p className="text-xs text-slate-500">
                Update details and permissions for {staff.name}.
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

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={staff.email}
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assigned Permissions ({selectedPermissions.length} active)
              </label>
            </div>

            <div className="space-y-3">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.perms.map((p) => p.key)
                const allSelected = groupKeys.every((k) => selectedPermissions.includes(k))

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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

