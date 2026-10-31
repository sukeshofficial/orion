// src/pages/portal/MyProfile.jsx
import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchPortalProfile,
  updatePortalProfile,
  changePassword,
} from "@/redux/Slices/customerPortalSlice"
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react"

export default function MyProfile() {
  const dispatch = useDispatch()
  const { profile, actionLoading, error } = useSelector((state) => state.portal)

  const [activeTab, setActiveTab] = React.useState("profile")
  const [successMsg, setSuccessMsg] = React.useState("")

  // Profile form state
  const [name, setName] = React.useState("Acme Corp")
  const [email, setEmail] = React.useState("acme@company.com")
  const [phone, setPhone] = React.useState("+1 555 010 1234")
  const [company, setCompany] = React.useState("Acme Corporation")
  const [addressLine1, setAddressLine1] = React.useState("123 Business Park Drive")
  const [addressLine2, setAddressLine2] = React.useState("Suite 400")
  const [city, setCity] = React.useState("San Francisco")
  const [stateName, setStateName] = React.useState("California")
  const [postalCode, setPostalCode] = React.useState("94107")
  const [country, setCountry] = React.useState("United States")

  // Password state
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  React.useEffect(() => {
    dispatch(fetchPortalProfile())
  }, [dispatch])

  React.useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name)
      if (profile.email) setEmail(profile.email)
      if (profile.phone) setPhone(profile.phone)
      if (profile.company) setCompany(profile.company)
      if (profile.billingAddress) {
        setAddressLine1(profile.billingAddress.addressLine1 || "")
        setAddressLine2(profile.billingAddress.addressLine2 || "")
        setCity(profile.billingAddress.city || "")
        setStateName(profile.billingAddress.state || "")
        setPostalCode(profile.billingAddress.postalCode || "")
        setCountry(profile.billingAddress.country || "")
      }
    }
  }, [profile])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSuccessMsg("")
    const payload = {
      name,
      phone,
      company,
      billingAddress: {
        addressLine1,
        addressLine2,
        city,
        state: stateName,
        postalCode,
        country,
      },
    }
    const res = await dispatch(updatePortalProfile(payload))
    if (!res.error) {
      setSuccessMsg("Profile updated successfully!")
      setTimeout(() => setSuccessMsg(""), 3000)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setSuccessMsg("")
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.")
      return
    }
    const res = await dispatch(
      changePassword({ currentPassword, newPassword })
    )
    if (!res.error) {
      setSuccessMsg("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccessMsg(""), 3000)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View and update your account information.
        </p>
      </div>

      {/* ── Tab Switcher ────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 border-b-2 transition ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`pb-3 border-b-2 transition ${
            activeTab === "password"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Change Password
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Tab 1: Profile Information ───────────────────────────────────── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                General Information
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                  <span className="absolute right-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Verified
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Right Column: Billing Address */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Billing Address
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Tab 2: Change Password ───────────────────────────────────────── */}
      {activeTab === "password" && (
        <form onSubmit={handleUpdatePassword} className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Change Password
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              {actionLoading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

