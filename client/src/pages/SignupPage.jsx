import * as React from "react"
import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Mail, User, Phone, Lock, ArrowRight, Loader2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthInput } from "@/components/auth/AuthInput"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { register } from "@/services/authService"
import { useAuth } from "@/context/AuthContext"
import { isRouteAllowedForRole, getDefaultDashboard } from "@/lib/roles"

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginUser, isAuthenticated, normalizedRole, loading: authLoading } = useAuth()

  // Redirect already authenticated users to their canonical dashboard
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && normalizedRole) {
      navigate(getDefaultDashboard(normalizedRole), { replace: true })
    }
  }, [authLoading, isAuthenticated, normalizedRole, navigate])

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const errors = {}

    // 1. Email format
    if (!formData.email.trim()) {
      errors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address."
    }

    // 2. Name required
    if (!formData.name.trim()) {
      errors.name = "Name is required."
    }

    // 3. Phone number validation
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required."
    } else {
      // Clean non-digit characters for length verification
      const digits = formData.phone.replace(/\D/g, "")
      if (digits.length < 8 || digits.length > 15) {
        errors.phone = "Please enter a valid phone number (8–15 digits)."
      }
    }

    // 4. Password validation
    if (!formData.password) {
      errors.password = "Password is required."
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters."
    }

    // 5. Confirm Password
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required."
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError("")

    if (!validate()) return

    try {
      setLoading(true)
      const data = await register({
        email: formData.email.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
      if (data?.token || data?.user) {
        loginUser(data.token, data.user)
      }

      // Public registration unconditionally creates a Customer (user) account
      const fromLocation = location.state?.from
      if (fromLocation?.pathname && isRouteAllowedForRole(fromLocation.pathname, "user")) {
        const target = `${fromLocation.pathname}${fromLocation.search || ""}`
        navigate(target, { replace: true })
      } else {
        navigate("/portal/dashboard", { replace: true })
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Registration failed. Please check your information and try again."
      setGeneralError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout pageVariant="interior">
      <div className="w-full max-w-sm mx-auto">
        {/* Page Heading & Subheading */}
        <div className="mb-6 pb-6 border-b border-border/60 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Get started with your Orion workspace
          </p>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
          >
            <span>{generalError}</span>
          </div>
        )}

        {/* 5-Field Registration Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {/* 1. Email */}
          <AuthInput
            id="register-email"
            name="email"
            label="Your Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            icon={Mail}
            autoComplete="email"
            required
          />

          {/* 2. Name */}
          <AuthInput
            id="register-name"
            name="name"
            label="Your Name"
            type="text"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            icon={User}
            autoComplete="name"
            required
          />

          {/* 3. Phone */}
          <AuthInput
            id="register-phone"
            name="phone"
            label="Your Phone"
            type="tel"
            placeholder="e.g. 9098980900"
            value={formData.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            icon={Phone}
            autoComplete="tel"
            required
          />

          {/* 4. Password + Strength indicator */}
          <div className="space-y-1">
            <AuthInput
              id="register-password"
              name="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              icon={Lock}
              isPassword={true}
              autoComplete="new-password"
              required
            />
            {formData.password && (
              <PasswordStrength password={formData.password} />
            )}
          </div>

          {/* 5. Confirm Password */}
          <AuthInput
            id="register-confirm-password"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            icon={Lock}
            isPassword={true}
            autoComplete="new-password"
            required
          />

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-medium py-3 px-4 text-sm transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Creating account…</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          {/* Secondary Action */}
          <div className="pt-4 text-center">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#2563eb] dark:text-[#3b82f6] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
