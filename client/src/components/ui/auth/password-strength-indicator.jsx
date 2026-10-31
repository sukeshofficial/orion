import * as React from "react"
import { Check, Circle, X } from "lucide-react"
import { cn } from "@/lib/utils"

const PASSWORD_RULES = [
    {
        key: "length",
        label: "At least 8 characters",
        test: (password) => password.length >= 8,
    },
    {
        key: "uppercase",
        label: "At least one uppercase letter (A–Z)",
        test: (password) => /[A-Z]/.test(password),
    },
    {
        key: "number",
        label: "At least one number (0–9)",
        test: (password) => /[0-9]/.test(password),
    },
    {
        key: "special",
        label: "At least one special character (!@#$%)",
        test: (password) => /[^A-Za-z0-9]/.test(password),
    },
]

function getStrength(metCount) {
    if (metCount <= 1) {
        return { label: "Weak", color: "bg-rose-400", textColor: "text-rose-400", activeSegments: 1 }
    }
    if (metCount === 2) {
        return { label: "Fair", color: "bg-amber-400", textColor: "text-amber-400", activeSegments: 2 }
    }
    if (metCount === 3) {
        return { label: "Good", color: "bg-emerald-400", textColor: "text-emerald-400", activeSegments: 3 }
    }
    return { label: "Strong", color: "bg-emerald-400", textColor: "text-emerald-400", activeSegments: 3 }
}

/**
 * Three-segment password meter with a live checklist.
 * The checklist is shown only when the user has started typing.
 */
function PasswordStrengthIndicator({ password = "", className }) {
    if (!password) return null

    const rules = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }))
    const metCount = rules.filter((rule) => rule.met).length
    const strength = getStrength(metCount)

    return (
        <div className={cn("mt-3 space-y-3", className)} aria-live="polite">
            <div className="space-y-2">
                <div className="flex gap-1.5" aria-label={`Password strength: ${strength.label}`}>
                    {[0, 1, 2].map((segment) => (
                        <div
                            key={segment}
                            className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                                segment < strength.activeSegments ? strength.color : "bg-neutral-700",
                            )}
                        />
                    ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className={cn("text-xs font-medium", strength.textColor)}>{strength.label}</span>
                    <span className="text-xs text-neutral-500">{metCount} of {rules.length} criteria met</span>
                </div>
            </div>

            <ul className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                {rules.map((rule) => (
                    <li key={rule.key} className="flex items-center gap-2.5 text-xs sm:text-sm">
                        {rule.met ? (
                            <Check className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                        ) : password.length > 0 ? (
                            <X className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
                        ) : (
                            <Circle className="size-3.5 shrink-0 text-neutral-500" aria-hidden="true" />
                        )}
                        <span className={rule.met ? "text-neutral-300" : "text-neutral-400"}>{rule.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export { PasswordStrengthIndicator }
