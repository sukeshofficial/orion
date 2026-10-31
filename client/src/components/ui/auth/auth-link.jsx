import { cn } from "@/lib/utils"

/**
 * AuthLink
 *
 * Props:
 *  - label     {string}    Displayed link text.
 *  - href      {string}    Optional URL. Renders a semantic <a> when supplied.
 *  - onClick   {function}  Optional click handler. Renders an inline <button> when href is absent.
 *  - className {string}    Optional className override.
 *
 * Never renders a fake href="#". When only onClick is supplied, uses a <button type="button">
 * styled to look like an inline link so keyboard and assistive-tech semantics are correct.
 */
function AuthLink({ label, href, onClick, className }) {
    const base = cn(
        "text-sm text-blue-600 underline-offset-4 hover:underline",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        "cursor-pointer",
        className
    )

    if (href) {
        return (
            <a href={href} className={base}>
                {label}
            </a>
        )
    }

    return (
        <button type="button" onClick={onClick} className={cn(base, "bg-transparent p-0 border-0 font-inherit")}>
            {label}
        </button>
    )
}

export { AuthLink }
