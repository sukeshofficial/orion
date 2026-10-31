import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

/**
 * AuthInput
 * Reusable input matching the visual reference with icon prefix, clean border,
 * focus ring, placeholder styling, and optional password visibility button.
 */
export function AuthInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  autoComplete,
  required = false,
  disabled = false,
  isPassword = false,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = React.useState(false)
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        )}

        <input
          id={id}
          name={name}
          type={effectiveType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border text-sm transition-all outline-none py-2.5 ${
            Icon ? "pl-10" : "pl-3.5"
          } ${isPassword ? "pr-10" : "pr-3.5"} ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/20 dark:bg-red-950/20 text-foreground"
              : "border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/80 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-foreground placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-0.5 cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-red-600 dark:text-red-400 font-normal leading-tight pt-0.5"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default AuthInput
