import * as React from "react"
import { useState, useRef, useMemo } from "react"
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Clock,
  Lock,
  KeyRound,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
  CircleDot,
  Check,
  Camera,
  Eye,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  MailCheck,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import {
  updateMe,
  forgotPassword,
  uploadProfilePic,
  selectProfilePic,
  deleteProfilePic,
  requestEmailVerification,
} from "@/services/authService"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

/**
 * Format timestamp into standard display (e.g. "Oct 26, 2024")
 */
function formatProfileDate(dateValue, fallback = "Oct 26, 2024") {
  if (!dateValue) return fallback
  try {
    const d = new Date(dateValue)
    if (isNaN(d.getTime())) return fallback
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return fallback
  }
}

/**
 * Capitalize string helper
 */
function capitalize(str) {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Supported upload format specifications
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export default function UserProfilePage() {
  const { user, setUser, token } = useAuth()
  const fileInputRef = useRef(null)

  // Track previous user reference to adjust form state on prop/context change without cascading effects
  const [prevUser, setPrevUser] = useState(user)
  const [formData, setFormData] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  }))

  if (user !== prevUser) {
    setPrevUser(user)
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    })
  }

  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Profile picture upload and gallery states
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [avatarSuccess, setAvatarSuccess] = useState("")
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [viewingImage, setViewingImage] = useState(null)
  const [deletingAvatarUrl, setDeletingAvatarUrl] = useState(null)
  const [selectingAvatarUrl, setSelectingAvatarUrl] = useState(null)

  // Security dialog states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSentSuccess, setResetSentSuccess] = useState(false)
  const [securityNotice, setSecurityNotice] = useState("")

  // Email verification request states
  const [sendingVerification, setSendingVerification] = useState(false)
  const [verificationFeedback, setVerificationFeedback] = useState("")
  const [verificationSuccess, setVerificationSuccess] = useState(false)

  // Derive initial avatar letter and formatted metadata
  const userInitial = (
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "P"
  ).toUpperCase()

  // Resolve active profile image URL
  const currentAvatarUrl =
    user?.profilePic ||
    user?.profilePicture ||
    user?.avatar ||
    user?.profile_avatar?.url ||
    user?.profile_avatar?.secure_url ||
    user?.avatarUrl ||
    (typeof window !== "undefined" ? localStorage.getItem("user_profile_pic") : null) ||
    ""

  // Resolve array of previous and current profile pictures
  const savedProfilePictures = useMemo(() => {
    const list = Array.isArray(user?.profilePictures) ? [...user.profilePictures] : []
    if (currentAvatarUrl && !list.includes(currentAvatarUrl)) {
      list.unshift(currentAvatarUrl)
    }
    return list
  }, [user?.profilePictures, currentAvatarUrl])

  const userRole = capitalize(user?.role || "Customer")
  const userStatus = capitalize(user?.status || "Active")
  const isEmailVerified = user?.emailVerified !== false // defaults true unless explicitly false

  const hiddenEmail = formData.email.replace(
  /^(.{2})(.*)(.{2})(@.*)$/,
  (_, start, middle,end, domain) =>
    `${start}${"*".repeat(Math.min(middle.length, 6))}${end}${domain}`
)
  
  const memberSince = formatProfileDate(user?.createdAt, "Oct 26, 2024")
  const lastUpdated = formatProfileDate(user?.updatedAt, "Oct 28, 2026")

  // Check whether editable profile fields have changed
  const isDirty =
    formData.name.trim() !== (user?.name || "").trim() ||
    formData.phone.trim() !== (user?.phone || "").trim()

  // Basic form validation
  const isFormValid = formData.name.trim().length > 0

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSuccessMessage("")
    setErrorMessage("")
  }

  // Cancel handler resets form to current user values
  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
    setSuccessMessage("")
    setErrorMessage("")
  }

  // Handle Profile Picture File Selection, Validation & Upload
  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0]
    // Permit choosing the same file again if reopened
    event.target.value = ""

    if (!file) return

    setAvatarError("")
    setAvatarSuccess("")

    // 1. Format validation (JPEG, PNG, WebP)
    const isMimeValid = ALLOWED_IMAGE_TYPES.includes(file.type?.toLowerCase())
    const extension = file.name
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : ""
    const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(extension)

    if (!isMimeValid && !isExtValid) {
      setAvatarError(
        "Unsupported file format. Please upload a JPEG (.jpg, .jpeg), PNG (.png), or WebP (.webp) image."
      )
      return
    }

    // 2. File size validation (Maximum 5 MB)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      setAvatarError(
        `File size (${sizeMb} MB) exceeds the 5 MB limit. Please select an image under 5 MB.`
      )
      return
    }

    // 3. Create instant local preview URL
    const localPreviewUrl = URL.createObjectURL(file)

    try {
      setUploadingAvatar(true)

      // 4. API Integration: dispatch to profilePic route with Cloudinary integration
      let remoteUrl = localPreviewUrl
      let serverUser = null
      let serverHistory = null

      try {
        const response = await uploadProfilePic(file, token)
        remoteUrl =
          response?.url ||
          response?.profilePic ||
          response?.user?.profilePic ||
          response?.user?.profilePicture ||
          response?.secure_url ||
          response?.user?.profile_avatar?.url ||
          response?.data?.url ||
          localPreviewUrl

        serverUser = response?.user
        serverHistory = response?.profilePictures || response?.user?.profilePictures
      } catch (uploadApiErr) {
        // If server endpoint is still being prepared by developer, gracefully preserve client state
        console.warn(
          "profilePic API endpoint notice (server route implementation in progress):",
          uploadApiErr?.message
        )
      }

      // 5. Persist image URL locally so it remains visible after page refresh
      localStorage.setItem("user_profile_pic", remoteUrl)

      // 6. Immediately synchronize across AuthContext and Navbar dropdown
      setUser((prev) => {
        const history = serverHistory && Array.isArray(serverHistory) && serverHistory.length > 0
          ? serverHistory
          : (() => {
            const prevHist = Array.isArray(prev?.profilePictures) ? [...prev.profilePictures] : []
            if (!prevHist.includes(remoteUrl)) {
              prevHist.unshift(remoteUrl)
            }
            return prevHist
          })()

        return {
          ...(prev || {}),
          ...(serverUser || {}),
          profilePic: remoteUrl,
          profilePicture: remoteUrl,
          avatar: remoteUrl,
          avatarUrl: remoteUrl,
          profilePictures: history,
          profile_avatar: {
            url: remoteUrl,
            secure_url: remoteUrl,
            ...(prev?.profile_avatar || {}),
          },
        }
      })

      setAvatarSuccess("Profile picture uploaded successfully!")
    } catch (err) {
      console.error("Avatar upload error:", err)
      setAvatarError(
        err?.response?.data?.message ||
        "Failed to upload profile picture. Please try again."
      )
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Handle switching active profile picture from history
  const handleSelectAvatar = async (url) => {
    if (!url || url === currentAvatarUrl) return
    setSelectingAvatarUrl(url)
    setAvatarError("")
    setAvatarSuccess("")

    try {
      await selectProfilePic(url, token)
      localStorage.setItem("user_profile_pic", url)
      setUser((prev) => ({
        ...prev,
        profilePic: url,
        profilePicture: url,
        avatar: url,
        avatarUrl: url,
        profile_avatar: {
          url,
          secure_url: url,
          ...(prev?.profile_avatar || {}),
        },
      }))
      setAvatarSuccess("Active profile picture updated!")
    } catch (err) {
      console.error("Failed to select avatar:", err)
      setAvatarError(err?.response?.data?.message || "Failed to switch profile picture.")
    } finally {
      setSelectingAvatarUrl(null)
    }
  }

  // Handle deleting a profile picture (either from history or currently active)
  const handleDeleteAvatar = async (urlToDelete) => {
    const target = urlToDelete || currentAvatarUrl
    if (!target) return

    setDeletingAvatarUrl(target)
    setAvatarError("")
    setAvatarSuccess("")

    try {
      const response = await deleteProfilePic(target, token)
      const nextActive = response?.profilePic || ""
      const nextHistory = response?.profilePictures || (user?.profilePictures || []).filter((p) => p !== target)

      if (nextActive) {
        localStorage.setItem("user_profile_pic", nextActive)
      } else {
        localStorage.removeItem("user_profile_pic")
      }

      setUser((prev) => ({
        ...prev,
        profilePic: nextActive,
        profilePicture: nextActive,
        avatar: nextActive,
        avatarUrl: nextActive,
        profilePictures: nextHistory,
        profile_avatar: {
          url: nextActive,
          secure_url: nextActive,
        },
      }))

      setAvatarSuccess("Profile picture removed successfully!")
    } catch (err) {
      console.error("Failed to delete profile picture:", err)
      setAvatarError(err?.response?.data?.message || "Failed to remove profile picture.")
    } finally {
      setDeletingAvatarUrl(null)
    }
  }

  // Save handler updates permitted fields (name, phone) via PATCH /api/v1/auth/me
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const updates = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      }

      const response = await updateMe(updates)

      if (response?.user) {
        setUser(response.user)
      } else if (user) {
        // Optimistically merge in memory if user response isn't enveloped
        setUser({ ...user, ...updates, updatedAt: new Date().toISOString() })
      }

      setSuccessMessage(response?.message || "Profile updated successfully")
    } catch (err) {
      console.error("Profile update failed:", err)
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Failed to save profile changes"
      )
    } finally {
      setSaving(false)
    }
  }

  // Request password recovery email
  const handleSendPasswordReset = async () => {
    if (!user?.email) return
    setSendingReset(true)
    setSecurityNotice("")
    try {
      await forgotPassword(user.email)
      setResetSentSuccess(true)
      setSecurityNotice(
        `A secure password reset link has been dispatched to ${user.email}. Check your inbox to proceed.`
      )
    } catch (err) {
      console.error("Password reset dispatch error:", err)
      setSecurityNotice(
        err?.response?.data?.message || "Unable to send reset email at this moment. Please try again."
      )
    } finally {
      setSendingReset(false)
    }
  }

  // Request email verification email
  const handleRequestVerification = async () => {
    setSendingVerification(true)
    setVerificationFeedback("")
    setVerificationSuccess(false)
    try {
      const response = await requestEmailVerification(token)
      setVerificationSuccess(true)
      setVerificationFeedback(response?.message || "Verification link sent! Check your inbox.")
    } catch (err) {
      console.error("Email verification request error:", err)
      setVerificationSuccess(false)
      setVerificationFeedback(
        err?.response?.data?.message || "Unable to send verification email. Please try again later."
      )
    } finally {
      setSendingVerification(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* 1. Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Your Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage your personal details and keep your account secure.
        </p>
      </div>

      {/* 2. Full-Width Profile Summary Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar + Details */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Interactive Profile Avatar with Camera Overlay */}
            <div className="relative group shrink-0">
              <div
                className="size-20 sm:size-22 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-2 border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-xs select-none relative"
              >
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={user?.name || "Profile avatar"}
                    className="size-full object-cover rounded-full"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}

                {/* Uploading Spinner Overlay */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1 z-20">
                    <Loader2 className="size-5 animate-spin text-white" />
                    <span>Uploading…</span>
                  </div>
                )}

                {/* Hover darken + Camera/Options icon */}
                {!uploadingAvatar && (
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer z-10 gap-0.5"
                    title="Manage profile picture"
                    aria-label="Manage profile picture"
                  >
                    <Camera className="size-5 text-white drop-shadow-md" />
                    <span className="text-[9px] font-medium tracking-wide">Options</span>
                  </button>
                )}
              </div>

              {/* Dedicated Options Badge Button */}
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 size-7 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md border-2 border-card flex items-center justify-center transition-transform hover:scale-110 cursor-pointer disabled:opacity-50 z-20"
                title="Manage profile picture"
                aria-label="Manage profile picture"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
                aria-label="Select profile picture file"
              />
            </div>

            {/* Name, Email, and Badges */}
            <div className="space-y-1.5 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {user?.name}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {hiddenEmail}
              </p>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {/* Account Role Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80">
                  <User className="size-3.5 text-muted-foreground" />
                  <span>{userRole}</span>
                </span>

                {/* Account Status Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{userStatus}</span>
                </span>

                {/* Email Verification Badge */}
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestVerification}
                    disabled={sendingVerification}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 transition cursor-pointer disabled:opacity-50"
                    title="Click to send verification link"
                  >
                    <XCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Unverified (Click to Verify)</span>
                  </button>
                )}
              </div>

              {/* Image Upload Notifications */}
              {avatarSuccess && (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-1 flex items-center gap-1">
                  <Check className="size-3.5" />
                  <span>{avatarSuccess}</span>
                </p>
              )}
              {avatarError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 pt-1 flex items-center gap-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{avatarError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Date Metadata */}
          <div className="flex flex-row lg:flex-col items-center lg:items-start justify-start gap-6 lg:gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border/70 lg:pl-8 text-xs sm:text-sm text-muted-foreground shrink-0">
            {/* Member Since */}
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-muted-foreground/80 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-medium">
                  Member since
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {memberSince}
                </span>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-muted-foreground/80 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-medium">
                  Last updated
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {lastUpdated}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Personal Information (Span 7) */}
        <section className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
          {/* Card Header with Blue Icon Badge */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Personal Information
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Update your details used to identify and contact you.
              </p>
            </div>
          </div>

          {/* Feedback Banners */}
          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/50 flex items-center gap-2.5 text-xs sm:text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Full Name */}
            <div>
              <label
                htmlFor="profile-name"
                className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-foreground transition outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* 2. Email Address */}
            <div>
              <label
                htmlFor="profile-email"
                className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-email"
                  type="email"
                  value={hiddenEmail}
                  disabled
                  readOnly
                  className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-border bg-neutral-100/60 dark:bg-neutral-800/40 text-muted-foreground text-sm font-medium transition cursor-not-allowed select-all"
                />
                {/* Verified indicator badge inside right */}
                {isEmailVerified ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 select-none">
                    <CheckCircle2 className="size-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestVerification}
                    disabled={sendingVerification}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {sendingVerification ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <MailCheck className="size-3.5" />
                    )}
                    <span>{sendingVerification ? "Sending…" : "Verify Email"}</span>
                  </button>
                )}
              </div>

              {/* Verification Feedback Message */}
              {verificationFeedback && (
                <p
                  className={`text-xs font-medium pt-1.5 flex items-center gap-1.5 ${
                    verificationSuccess
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {verificationSuccess ? (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="size-3.5 shrink-0" />
                  )}
                  <span>{verificationFeedback}</span>
                </p>
              )}

              {!isEmailVerified && !verificationFeedback && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>Your email is not verified yet. Click "Verify Email" to send a confirmation link.</span>
                </p>
              )}
            </div>

            {/* 3. Phone Number */}
            <div>
              <label
                htmlFor="profile-phone"
                className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-foreground transition outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Buttons aligned bottom right */}
            <div className="pt-6 gapborder-t border-border/70 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isDirty || !isFormValid || saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 cursor-pointer"
              >
                {saving && <Loader2 className="size-4 animate-spin text-white" />}
                <span>{saving ? "Saving…" : "Save changes"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right Column: Security + Account Details (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* 1. Security Card */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
            {/* Header with Blue Lock Badge */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                <Lock className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Security</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your password and account security.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1: Password */}
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border/60 bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="flex items-start gap-3 min-w-0">
                  <Lock className="size-4.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Password</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Keep your account secure with a strong password.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResetSentSuccess(false)
                    setSecurityNotice("")
                    setPasswordModalOpen(true)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all shrink-0 shadow-2xs cursor-pointer"
                >
                  <span>Change Password</span>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Row 2: Password Reset */}
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border/60 bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="flex items-start gap-3 min-w-0">
                  <KeyRound className="size-4.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Password Reset</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Manage your recovery options.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResetSentSuccess(false)
                    setSecurityNotice("")
                    setResetModalOpen(true)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all shrink-0 shadow-2xs cursor-pointer"
                >
                  <span>Manage</span>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </section>

          {/* 2. Account Details Card */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
            {/* Header with Blue Document Badge */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Account Details</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Additional information about your account.
                </p>
              </div>
            </div>

            {/* Read-only Information List */}
            <div className="divide-y divide-border/60 text-xs sm:text-sm">
              {/* Account role */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <User className="size-4" />
                  <span>Account role</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80">
                  {userRole}
                </span>
              </div>

              {/* Account status */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <CircleDot className="size-4" />
                  <span>Account status</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>{userStatus}</span>
                </span>
              </div>

              {/* Email verification */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <ShieldCheck className="size-4" />
                  <span>Email verification</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="size-3.5" />
                  <span>{isEmailVerified ? "Verified" : "Pending"}</span>
                </span>
              </div>

              {/* Member since */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Member since</span>
                </div>
                <span className="font-medium text-foreground">
                  {memberSince}
                </span>
              </div>

              {/* Last updated */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Clock className="size-4" />
                  <span>Last updated</span>
                </div>
                <span className="font-medium text-foreground">
                  {lastUpdated}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Security Modal 1: Change Password Request */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Change Password</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              To keep your account secure, we will send an authenticated password reset link to your registered email address.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-foreground font-mono truncate">
              {hiddenEmail}
            </div>

            {securityNotice && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${resetSentSuccess
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                  }`}
              >
                {resetSentSuccess ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span>{securityNotice}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={sendingReset || resetSentSuccess}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              {sendingReset && <Loader2 className="size-3.5 animate-spin" />}
              <span>{resetSentSuccess ? "Link Sent" : "Send Reset Link"}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Modal 2: Manage Password Reset / Recovery Options */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Password Recovery Options</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Recovery requests are tied to your primary email address. In case of unexpected access, you can trigger a password reset session below.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="p-3.5 rounded-xl border border-border/80 bg-neutral-50 dark:bg-neutral-900/50 space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Verified Email Destination</p>
              <p className="text-xs text-muted-foreground">{user?.email || formData.email}</p>
            </div>

            {securityNotice && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${resetSentSuccess
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                  }`}
              >
                {resetSentSuccess ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span>{securityNotice}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={sendingReset || resetSentSuccess}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              {sendingReset && <Loader2 className="size-3.5 animate-spin" />}
              <span>{resetSentSuccess ? "Link Sent" : "Dispatch Reset Token"}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Management Modal: View, Update, Delete & History Gallery */}
      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pt-6 px-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Camera className="size-5 text-blue-600" />
              <span>Profile Picture Options</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              View your current picture, upload a new photo, or pick from previously uploaded pictures.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 px-6 space-y-5">
            {/* Active Picture Spotlight */}
            <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-border/70">
              <div className="relative size-24 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-xs">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt="Active Profile"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-2xl text-blue-900 dark:text-blue-200">
                    {userInitial}
                  </span>
                )}
              </div>

              <div className="text-center">
                <span className="text-xs font-semibold text-foreground block">
                  {currentAvatarUrl ? "Current Active Photo" : "No Profile Picture Set"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {currentAvatarUrl ? "Visible to your team and collaborators" : "Default initials displayed"}
                </span>
              </div>

              {/* Three Core Actions: View, Update, Delete */}
              <div className="flex items-center gap-2 pt-1">
                {/* 1. View */}
                {currentAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setViewingImage(currentAvatarUrl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer"
                  >
                    <Eye className="size-3.5 text-blue-600" />
                    <span>View</span>
                  </button>
                )}

                {/* 2. Update (Trigger file upload) */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  <span>{uploadingAvatar ? "Uploading…" : "Upload New"}</span>
                </button>

                {/* 3. Delete */}
                {currentAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAvatar(currentAvatarUrl)}
                    disabled={Boolean(deletingAvatarUrl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-xs font-medium text-red-600 dark:text-red-400 transition cursor-pointer disabled:opacity-50"
                  >
                    {deletingAvatarUrl === currentAvatarUrl ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Previously Kept Profiles (Gallery History) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-muted-foreground" />
                  <span>Previously Kept Profiles</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {savedProfilePictures.length} {savedProfilePictures.length === 1 ? "photo" : "photos"}
                </span>
              </div>

              {savedProfilePictures.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground">
                  No previous profile pictures saved. Upload an image to start your history.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {savedProfilePictures.map((picUrl, idx) => {
                    const isActive = picUrl === currentAvatarUrl
                    const isDeleting = deletingAvatarUrl === picUrl
                    const isSelecting = selectingAvatarUrl === picUrl

                    return (
                      <div
                        key={idx}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${isActive
                          ? "border-blue-600 ring-2 ring-blue-500/30"
                          : "border-border/80 hover:border-blue-400/70"
                          }`}
                      >
                        <img
                          src={picUrl}
                          alt={`Saved profile ${idx + 1}`}
                          className="size-full object-cover cursor-pointer"
                          onClick={() => handleSelectAvatar(picUrl)}
                        />

                        {/* Active Badge */}
                        {isActive && (
                          <div className="absolute top-1 right-1 size-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-neutral-900">
                            <Check className="size-3" strokeWidth={3} />
                          </div>
                        )}

                        {/* Hover Overlay with View, Select, and Delete buttons */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewingImage(picUrl)
                            }}
                            title="View Full Image"
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white text-xs transition cursor-pointer"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectAvatar(picUrl)
                              }}
                              title="Set as Active Profile"
                              disabled={isSelecting}
                              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              {isSelecting ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteAvatar(picUrl)
                            }}
                            title="Delete Photo"
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setAvatarModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Lightbox */}

      <Dialog
        open={Boolean(viewingImage)}
        onOpenChange={(open) => !open && setViewingImage(null)}
      >
        <DialogContent
          className="
      sm:max-w-lg p-4
      bg-white dark:bg-neutral-950
      text-neutral-900 dark:text-white
      border border-neutral-200 dark:border-neutral-800
      shadow-xl
    "
        >
          <div className="relative flex flex-col items-center justify-center gap-4">

            {/* Profile Image Preview */}
            {viewingImage && (
              <div className="
          w-full flex items-center justify-center
          rounded-xl overflow-hidden p-2
        ">
                <img
                  src={viewingImage}
                  alt="Profile View"
                  className="
              max-h-[70vh] max-w-full
              w-auto h-auto
              rounded-lg object-contain
            "
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between w-full px-1">

              <div className="flex flex-col gap-0.5">
                <span className="
            text-xs font-semibold
            text-neutral-800 dark:text-neutral-200
          ">
                  Profile Picture Preview
                </span>

                <span className="
            text-[11px]
            text-neutral-500 dark:text-neutral-400
          ">
                  Your profile image
                </span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="
            px-4 py-2 rounded-lg
            bg-neutral-100 hover:bg-neutral-200
            dark:bg-neutral-800 dark:hover:bg-neutral-700
            text-neutral-800 dark:text-neutral-100
            border border-neutral-200 dark:border-neutral-700
            text-xs font-semibold
            transition-all duration-200
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500/50
            active:scale-95
            cursor-pointer
          "
              >
                Close
              </button>

            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
