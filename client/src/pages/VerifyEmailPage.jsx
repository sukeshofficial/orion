import * as React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { confirmEmailVerification } from "@/services/authService"
import { useAuth } from "@/context/AuthContext"
import { getDefaultDashboard, getRoleProfilePath } from "@/lib/roles"
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowRight, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const emailParam = searchParams.get("email") || ""

  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("ready") // 'ready' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("No verification token was provided in the URL. Please check the link in your email.")
    }
  }, [token])

  const handleConfirmVerification = async () => {
    if (!token) return

    setLoading(true)
    setStatus("loading")
    setErrorMessage("")

    try {
      const response = await confirmEmailVerification(token)
      setStatus("success")

      // Update user in context if authenticated
      if (response?.user) {
        setUser(response.user)
      } else if (user) {
        setUser({ ...user, emailVerified: true })
      }
    } catch (err) {
      console.error("Verification confirmation error:", err)
      setStatus("error")
      setErrorMessage(
        err?.response?.data?.message ||
        "Invalid or expired verification link. Please sign in and request a new verification email."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950 text-foreground transition-colors">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Icon Header */}
        <div className="flex justify-center">
          {status === "success" ? (
            <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30">
              <CheckCircle2 className="size-8" />
            </div>
          ) : status === "error" ? (
            <div className="size-14 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center ring-8 ring-red-50 dark:ring-red-950/30">
              <AlertCircle className="size-8" />
            </div>
          ) : (
            <div className="size-14 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-8 ring-blue-50 dark:ring-blue-950/30">
              <Mail className="size-8" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {status === "success"
              ? "Email Verified!"
              : status === "error"
              ? "Verification Failed"
              : "Verify Your Email"}
          </h1>

          <p className="text-sm text-muted-foreground">
            {status === "success"
              ? "Your email address has been successfully verified. You now have full access to all features."
              : status === "error"
              ? errorMessage
              : `Click below to confirm and verify ${emailParam ? emailParam : "your email address"}.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          {status === "ready" && (
            <button
              type="button"
              onClick={handleConfirmVerification}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              <span>Confirm & Verify Email</span>
            </button>
          )}

          {status === "loading" && (
            <div className="py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
              <Loader2 className="size-5 animate-spin text-blue-600" />
              <span>Verifying your email…</span>
            </div>
          )}

          {status === "success" && (
            <Link
              to={user ? getDefaultDashboard(user.role) : "/portal/dashboard"}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="size-4" />
            </Link>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <Link
                to={user ? getRoleProfilePath(user.role) : "/login"}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm"
              >
                <span>Go to Profile to Resend</span>
              </Link>
              <Link
                to="/login"
                className="block text-xs text-muted-foreground hover:text-foreground transition pt-2"
              >
                Back to Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
