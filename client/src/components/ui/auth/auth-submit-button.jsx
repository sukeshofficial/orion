import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * AuthSubmitButton
 *
 * Props:
 *  - label       {string}    Button label.
 *  - type        {string}    Native button type: "button" | "submit" | "reset". Default: "submit"
 *  - onClick     {function}  Optional click handler.
 *  - disabled    {boolean}   Disabled state.
 *  - loading     {boolean}   Shows spinner and swaps to loadingText when true.
 *  - loadingText {string}    Label shown while loading. Default: "Please wait…"
 *  - className   {string}    Optional className override.
 */
function AuthSubmitButton({
    label,
    type = "submit",
    onClick,
    disabled = false,
    loading = false,
    loadingText = "Please wait…",
    className,
}) {
    return (
        <Button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            aria-busy={loading}
            className={cn(
                "w-full rounded-full border border-blue-500 bg-transparent px-8 py-2.5 text-sm font-semibold uppercase tracking-widest text-gray-800",
                "hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                "disabled:pointer-events-none disabled:opacity-50",
                "h-auto min-h-[2.75rem]",
                className
            )}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 size-4 animate-spin" data-icon="inline-start" />
                    {loadingText}
                </>
            ) : (
                label
            )}
        </Button>
    )
}

export { AuthSubmitButton }
