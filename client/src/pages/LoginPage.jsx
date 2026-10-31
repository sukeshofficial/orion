import * as React from "react"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthInput } from "@/components/auth/AuthInput"
import { login, forgotPassword } from "@/services/authService"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState("")
  const [forgotError, setForgotError] = useState("")

  const validate = () => {
    const errors = {}
    if (!email.trim()) {
      errors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address."
    }

    if (!password) {
      errors.password = "Password is required."
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters."
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError("")

    if (!validate()) return

    try {
      setLoading(true)
      const data = await login(email.trim(), password)
      if (data?.token || data?.user) {
        loginUser(data.token, data.user)
      }
      navigate("/dashboard")
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Invalid email or password. Please try again."
      setGeneralError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess("")

    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotError("Please enter a valid email address.")
      return
    }

    try {
      setForgotLoading(true)
      await forgotPassword(forgotEmail.trim())
      setForgotSuccess("Password reset instructions have been sent to your email.")
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Unable to send reset instructions. Please try again."
      setForgotError(msg)
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <AuthLayout pageVariant="exterior">
      <div className="w-full max-w-sm mx-auto">
        {/* Page Heading and Subheading */}
        <div className="mb-8 text-center pb-6 border-b border-border/60">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to your Orion workspace
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthInput
            id="login-email"
            name="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }))
            }}
            error={formErrors.email}
            icon={Mail}
            autoComplete="email"
            required
          />

          <AuthInput
            id="login-password"
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }))
            }}
            error={formErrors.password}
            icon={Lock}
            isPassword={true}
            autoComplete="current-password"
            required
          />

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-medium py-3 px-4 text-sm transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          {/* Secondary Actions */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email)
                setForgotSuccess("")
                setForgotError("")
                setShowForgotModal(true)
              }}
              className="text-xs sm:text-sm text-[#2563eb] dark:text-[#3b82f6] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded font-medium cursor-pointer"
            >
              Forgot username / password?
            </button>
          </div>

          <div className="pt-6 border-t border-border/60 text-center">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-[#2563eb] dark:text-[#3b82f6] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                Register here
              </Link>
            </p>
          </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
              <h3
                id="forgot-modal-title"
                className="text-lg font-bold text-foreground"
              >
                Reset Password
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Enter your registered email address and we'll send you recovery
                instructions.
              </p>

              {forgotSuccess ? (
                <div className="space-y-4 pt-2">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                    {forgotSuccess}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 py-2.5 text-xs font-semibold hover:opacity-90 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <AuthInput
                    id="forgot-email"
                    name="forgotEmail"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    error={forgotError}
                    icon={Mail}
                    required
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading && <Loader2 className="size-3.5 animate-spin" />}
                      <span>Send Instructions</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}