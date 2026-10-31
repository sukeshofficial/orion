import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * HomeButton
 *
 * Props:
 *  - label     {string}    Button label. Default: "Home"
 *  - href      {string}    Optional URL. Renders as <a> when provided.
 *  - onClick   {function}  Optional click handler.
 *  - disabled  {boolean}   Disabled state.
 *  - className {string}    Optional className override.
 *
 * Note: When href is supplied the component renders a styled <a> so that
 * link semantics are preserved without nesting <button> inside <a>.
 */
function HomeButton({ label = "Home", href, onClick, disabled = false, className }) {
    const styles = cn(
        "rounded-full border border-blue-500 bg-transparent px-5 py-1 text-sm font-medium text-blue-600",
        "hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        "disabled:pointer-events-none disabled:opacity-50",
        className
    )

    if (href) {
        return (
            <a
                href={href}
                className={cn(buttonVariants({ variant: "outline" }), styles)}
                aria-disabled={disabled}
            >
                {label}
            </a>
        )
    }

    return (
        <Button
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className={styles}
        >
            {label}
        </Button>
    )
}

export { HomeButton }
