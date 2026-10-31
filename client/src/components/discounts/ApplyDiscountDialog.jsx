// src/components/discounts/ApplyDiscountDialog.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchDiscounts } from "@/redux/Slices/discountSlice"
import { formatCurrency, formatDate } from "@/lib/formatters"
import {
  X,
  Search,
  Check,
  Tag,
  Info,
  Loader2,
  Percent,
} from "lucide-react"

export default function ApplyDiscountDialog({
  isOpen,
  onClose,
  onApply,
  selectedDiscountId: initialSelectedId = null,
}) {
  const dispatch = useDispatch()
  const { discounts, loading } = useSelector((state) => state.discount)

  const [searchTerm, setSearchTerm] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("active")
  const [selectedId, setSelectedId] = React.useState(initialSelectedId)

  React.useEffect(() => {
    if (isOpen) {
      dispatch(fetchDiscounts({ limit: 100 }))
      setSelectedId(initialSelectedId)
    }
  }, [dispatch, isOpen, initialSelectedId])

  if (!isOpen) return null

  // Filter discounts
  const filteredDiscounts = (discounts || []).filter((d) => {
    const code = (d.code || "").toLowerCase()
    const name = (d.name || "").toLowerCase()
    const query = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || code.includes(query) || name.includes(query)

    const matchesType =
      typeFilter === "all" || (d.type || "").toLowerCase() === typeFilter.toLowerCase()

    const isActive = d.isActive !== undefined ? d.isActive : true
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive)

    return matchesSearch && matchesType && matchesStatus
  })

  const handleConfirm = () => {
    const chosen = (discounts || []).find((d) => (d._id || d.id) === selectedId)
    if (chosen && onApply) {
      onApply(chosen)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Apply Discount</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an available discount for this quotation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search discount by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="size-6 animate-spin mb-2" />
              <span className="text-xs">Loading available discounts...</span>
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No discounts found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="pb-3 w-8">#</th>
                  <th className="pb-3">Discount Name</th>
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Min. Purchase</th>
                  <th className="pb-3">Valid Until</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDiscounts.map((disc) => {
                  const dId = disc._id || disc.id
                  const isSelected = selectedId === dId
                  const isPercent = (disc.type || "").toLowerCase() === "percentage"
                  const displayVal = isPercent ? `${disc.value}%` : formatCurrency(disc.value)
                  const minPurchase = disc.minimumPurchase ? formatCurrency(disc.minimumPurchase) : "₹ 0"
                  const validUntil = disc.endDate ? formatDate(disc.endDate) : "Dec 31, 2026"
                  const active = disc.isActive !== undefined ? disc.isActive : true

                  return (
                    <tr
                      key={dId}
                      onClick={() => setSelectedId(dId)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-3">
                        <div
                          className={`size-4 rounded-full border flex items-center justify-center transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {disc.name}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded font-mono font-medium text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                          {disc.code}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400 capitalize">
                        {disc.type || "Percentage"}
                      </td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {displayVal}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {minPurchase}
                      </td>
                      <td className="py-3 text-slate-500">
                        {validUntil}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            active
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              active ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with Notice and Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <Info className="size-4 shrink-0" />
            <span>
              The final discount amount will be calculated by the backend based on the quotation products, quantities and eligibility rules.
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedId}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              Apply Discount
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

