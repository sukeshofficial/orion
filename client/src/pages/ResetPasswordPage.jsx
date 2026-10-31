import * as React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import { Lock, ArrowRight, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthInput } from "@/components/auth/AuthInput"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { resetPassword, verifyResetToken } from "@/services/authService"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Extract query parameters from email link: /reset-password?token=...&email=...
  const token = searchParams.get("token") || ""
  const emailParam = searchParams.get("email") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [verifying, setVerifying] = useState(Boolean(token))
  const [tokenValid, setTokenValid] = useState(Boolean(token))
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)

  // Verify token on mount if provided
  useEffect(() => {
    let isMounted = true

    async function checkToken() {
      if (!token) {
        setTokenValid(false)
        setVerifying(false)
        return
      }

      try {
        const response = await verifyResetToken(token)
        if (isMounted) {
          setTokenValid(response?.valid ?? true)
        }
      } catch (err) {
        console.warn("Token check warning:", err?.message)
        // If the server doesn't support the check route or is unreachable, allow user to attempt reset
        if (isMounted) {
          setTokenValid(true)
        }
      } finally {
        if (isMounted) {
          setVerifying(false)
        }
      }
    }

    void checkToken()

    return () => {
      isMounted = false
    }
  }, [token])

  const validate = () => {
    const errors = {}

    if (!password) {
      errors.password = "New password is required."
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters."
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required."
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError("")

    if (!token) {
      setGeneralError("Password reset token is missing. Please check your email link.")
      return
    }

    if (!validate()) return

    try {
      setLoading(true)
      await resetPassword({
        token,
        newPassword: password,
      })
      setSuccess(true)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to reset password. The link may have expired or is invalid."
      setGeneralError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout pageVariant="exterior">
      <div className="w-full max-w-sm mx-auto">
        {/* State A: Verifying Token */}
        {verifying && (
          <div className="text-center py-12 space-y-4">
            <Loader2 className="size-8 animate-spin mx-auto text-[#2563eb]" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Validating security token…
            </p>
          </div>
        )}

        {/* State B: Invalid or Missing Token */}
        {!verifying && !tokenValid && !success && (
          <div className="space-y-6 text-center py-6">
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Invalid or Expired Link
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                This password reset link is invalid or has expired for security reasons.
                Reset links are single-use and expire after 1 hour.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2.5 px-5 text-sm transition-all"
              >
                <span>Request New Link</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}

        {/* State C: Reset Successful */}
        {!verifying && success && (
          <div className="space-y-6 text-center py-6">
            <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Password updated
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 px-4 text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <span>Sign in to your account</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* State D: Reset Password Form */}
        {!verifying && tokenValid && !success && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Set new password
              </h2>
              <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                {emailParam ? (
                  <>
                    Resetting password for{" "}
                    <span className="font-medium text-foreground">{emailParam}</span>
                  </>
                ) : (
                  "Create a strong, secure password for your account."
                )}
              </p>
            </div>

            {/* Global Error Banner */}
            {generalError && (
              <div
                role="alert"
                className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
              >
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* New Password + Strength Indicator */}
              <div className="space-y-1.5">
                <AuthInput
                  id="reset-password"
                  name="password"
                  label="New Password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }))
                  }}
                  error={fieldErrors.password}
                  icon={Lock}
                  isPassword={true}
                  autoComplete="new-password"
                  required
                />
                {password && <PasswordStrength password={password} />}
              </div>

              {/* Confirm New Password */}
              <AuthInput
                id="reset-confirm-password"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }))
                }}
                error={fieldErrors.confirmPassword}
                icon={Lock}
                isPassword={true}
                autoComplete="new-password"
                required
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-medium py-3 px-4 text-sm transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating password…</span>
                  </>
                ) : (
                  <>
                    <span>Reset password</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              {/* Return to Login */}
              <div className="pt-4 border-t border-border/60 text-center">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  Remembered your password?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#2563eb] dark:text-[#3b82f6] hover:underline"
                  >
                    Back to login
                  </Link>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
