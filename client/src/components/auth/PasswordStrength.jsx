import * as React from "react"

/**
 * calculatePasswordStrength
 * Evaluates password strength according to standard rules:
 * - Length >= 8
 * - Mixed case (upper and lower)
 * - Number (0-9)
 * - Special character
 *
 * Returns: { level: 'Weak' | 'Medium' | 'Strong', score: 0 | 1 | 2 | 3 }
 */
function calculatePasswordStrength(password = "") {
  if (!password) {
    return { level: "Weak", score: 0 }
  }

  let checks = 0
  if (password.length >= 8) checks += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) checks += 1
  if (/[0-9]/.test(password)) checks += 1
  if (/[^A-Za-z0-9]/.test(password)) checks += 1

  if (checks <= 1 || password.length < 6) {
    return { level: "Weak", score: 1 }
  }
  if (checks === 2 || checks === 3) {
    return { level: "Medium", score: 2 }
  }
  return { level: "Strong", score: 3 }
}

/**
 * PasswordStrength
 * Exact 3-segment visual meter matching the reference mockup:
 * "Password strength  [ —— ] [ —— ] [ —— ]  Weak/Medium/Strong"
 */
export function PasswordStrength({ password = "", className = "" }) {
  const { level, score } = calculatePasswordStrength(password)

  // Segment colors based on active strength
  const getSegmentColor = (segmentIndex) => {
    if (score < segmentIndex) {
      return "bg-neutral-200 dark:bg-neutral-800"
    }
    if (score === 1) {
      return "bg-red-500"
    }
    if (score === 2) {
      return "bg-amber-500"
    }
    return "bg-emerald-500"
  }

  const getTextColor = () => {
    if (score === 0) return "text-neutral-400 dark:text-neutral-500"
    if (score === 1) return "text-red-500 dark:text-red-400"
    if (score === 2) return "text-amber-500 dark:text-amber-400"
    return "text-emerald-500 dark:text-emerald-400"
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 text-xs pt-1 ${className}`}
      aria-live="polite"
    >
      <span className="text-neutral-500 dark:text-neutral-400 shrink-0">
        Password strength
      </span>

      <div
        className="flex items-center gap-1.5 flex-1 max-w-[140px]"
        aria-label={`Password strength level: ${level}`}
      >
        <span
          className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${getSegmentColor(
            1
          )}`}
        />
        <span
          className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${getSegmentColor(
            2
          )}`}
        />
        <span
          className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${getSegmentColor(
            3
          )}`}
        />
      </div>

      <span
        className={`font-medium min-w-[45px] text-right transition-colors duration-200 ${getTextColor()}`}
      >
        {password ? level : "Weak"}
      </span>
    </div>
  )
}

export default PasswordStrength
