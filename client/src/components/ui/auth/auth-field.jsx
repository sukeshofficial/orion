import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

/**
 * AuthField
 *
 * Primary reusable field component covering every input in the Login and
 * Registration mockups via props.
 *
 * Props:
 *  - id             {string}              Unique input id. Required for label association.
 *  - name           {string}              Native input name attribute.
 *  - label          {string}              Field label text.
 *  - type           {string}              Native input type ("text"|"email"|"tel"|"password"). Default: "text"
 *  - placeholder    {string}              Placeholder text.
 *  - value          {string}              Controlled value. Do NOT supply with defaultValue.
 *  - defaultValue   {string}              Uncontrolled initial value. Do NOT supply with value.
 *  - onChange       {function}            onChange handler.
 *  - layout         {"horizontal"|"stacked"} Label placement. Default: "stacked"
 *  - required       {boolean}             Marks the field required.
 *  - disabled       {boolean}             Disables the input.
 *  - error          {string}              Validation error message. Sets aria-invalid when present.
 *  - autoComplete   {string}              Native autocomplete value.
 *  - endAdornment   {React.ReactElement}  Trailing content (e.g. PasswordStrengthIndicator).
 *  - className      {string}             Wrapper className override.
 *  - labelClassName {string}             Label className override.
 *  - inputClassName {string}             Input className override.
 *  - ...rest        Additional standard HTML input attributes forwarded to <Input>.
 */
function AuthField({
    id,
    name,
    label,
    type = "text",
    placeholder,
    value,
    defaultValue,
    onChange,
    layout = "stacked",
    required = false,
    disabled = false,
    error,
    autoComplete,
    endAdornment,
    className,
    labelClassName,
    inputClassName,
    ...rest
}) {
    const errorId = error ? `${id}-error` : undefined

    // Controlled vs uncontrolled — build the value props safely
    const valueProps =
        value !== undefined
            ? { value, onChange }
            : defaultValue !== undefined
                ? { defaultValue }
                : {}

    const isHorizontal = layout === "horizontal"

    return (
        <div
            className={cn(
                "flex w-full gap-2",
                isHorizontal
                    ? "flex-row items-center sm:flex-row flex-col sm:items-center items-stretch"
                    : "flex-col",
                className
            )}
        >
            {label && (
                <Label
                    htmlFor={id}
                    className={cn(
                        "text-sm font-medium text-gray-700 shrink-0",
                        isHorizontal ? "w-28 text-right" : "mb-0.5",
                        disabled && "opacity-50",
                        labelClassName
                    )}
                >
                    {label}
                    {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
                </Label>
            )}

            {/* Input wrapper — position: relative so endAdornment can be absolutely placed */}
            <div className={cn("relative flex w-full flex-col gap-1", isHorizontal && "flex-1")}>
                <Input
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={errorId}
                    {...valueProps}
                    className={cn(
                        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
                        "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30",
                        "disabled:bg-gray-50 disabled:text-gray-400",
                        error && "border-red-500 ring-1 ring-red-500/30",
                        endAdornment && "pr-24",
                        inputClassName
                    )}
                    {...rest}
                />

                {/* Trailing adornment — absolutely positioned at the right edge of the input */}
                {endAdornment && (
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                        {endAdornment}
                    </div>
                )}

                {/* Validation error */}
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="text-xs text-red-600 leading-snug"
                    >
                        {error}
                    </p>
                )}
            </div>
        </div>
    )
}

export { AuthField }
