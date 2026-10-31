// src/pages/admin/StaffListPage.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useLocation } from "react-router-dom"
import {
  fetchStaffList,
  updateStaffStatus,
  setStaffFilters,
  clearStaffFilters,
} from "@/redux/Slices/staffSlice"
import { formatDate } from "@/lib/formatters"
import AddStaffModal from "@/components/admin/AddStaffModal"
import EditStaffModal from "@/components/admin/EditStaffModal"
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Edit,
  Power,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
} from "lucide-react"

export default function StaffListPage() {
  const dispatch = useDispatch()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin"

  const { staffList, stats, pagination, filters, loading } = useSelector(
    (state) => state.staff
  )

  const [search, setSearch] = React.useState(filters.search || "")
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all")
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState(null)
  const [activeMenuId, setActiveMenuId] = React.useState(null)

  React.useEffect(() => {
    dispatch(fetchStaffList({ search, status: statusFilter }))
  }, [dispatch, search, statusFilter])

  const handleReset = () => {
    setSearch("")
    setStatusFilter("all")
    dispatch(clearStaffFilters())
  }

  const handleToggleStatus = async (staffMember) => {
    const id = staffMember._id || staffMember.id
    const newStatus = (staffMember.status || "").toLowerCase() === "active" ? "disabled" : "active"
    await dispatch(updateStaffStatus({ id, status: newStatus }))
    dispatch(fetchStaffList({ search, status: statusFilter }))
    setActiveMenuId(null)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Breadcrumb & Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to={`${basePath}/dashboard`} className="hover:text-blue-600 transition">
              Overview
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Staff</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Staff Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal staff members, operational seats, and permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm self-start sm:self-center"
        >
          <Plus className="size-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* ── 4 Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Staff
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.total ?? staffList.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Staff
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.active ?? 2}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <UserX className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Disabled
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">
              {stats.disabled ?? 1}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Shield className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Operational Seats
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              {stats.operationalSeats ?? 5}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Staff Table ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="size-8 animate-spin mb-2 text-blue-600" />
            <span className="text-xs">Loading staff directory...</span>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No staff members found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Permissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {staffList.map((member, idx) => {
                  const sId = member._id || member.id
                  const isActive = (member.status || "active").toLowerCase() === "active"
                  const perms = member.permissions || []

                  const initials = (member.name || "ST")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr key={sId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                              {member.name}
                            </span>
                            <span className="text-slate-400 text-[11px] block mt-0.5">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {member.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                          Internal Staff
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                          {perms.slice(0, 3).map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              {p}
                            </span>
                          ))}
                          {perms.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400">
                              +{perms.length - 3} more
                            </span>
                          )}
                          {perms.length === 0 && (
                            <span className="text-slate-400 text-[11px]">No permissions</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === sId ? null : sId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {activeMenuId === sId && (
                          <div
                            onClick={() => setActiveMenuId(null)}
                            className="absolute right-4 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-30 text-left text-xs"
                          >
                            <button
                              onClick={() => {
                                setEditingStaff(member)
                                setActiveMenuId(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Edit className="size-3.5" />
                              <span>Edit Permissions</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(member)}
                              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                isActive ? "text-red-600" : "text-emerald-600"
                              }`}
                            >
                              <Power className="size-3.5" />
                              <span>{isActive ? "Deactivate" : "Activate"}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Table Footer ────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {staffList.length} staff member{staffList.length === 1 ? "" : "s"}
          </div>
          <div className="text-slate-400">
            {stats.active} active · {stats.disabled} disabled
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => dispatch(fetchStaffList({}))}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={Boolean(editingStaff)}
        staff={editingStaff}
        onClose={() => setEditingStaff(null)}
        onSuccess={() => dispatch(fetchStaffList({}))}
      />
    </div>
  )
}

