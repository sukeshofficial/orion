import { cn } from "@/lib/utils"

/**
 * BrandTitle
 *
 * Props:
 *  - text       {string}  Displayed brand text. Default: "Rental Management"
 *  - href       {string}  Optional URL — renders an <a> when provided.
 *  - className  {string}  Optional className override.
 */
function BrandTitle({ text = "Orion", href, className }) {
  const base = cn(
    "text-sm font-semibold tracking-tight text-blue-600 select-none",
    className
  )

  if (href) {
    return (
      <a href={href} className={cn(base, "hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600")}>
        {text}
      </a>
    )
  }

  return <span className={base}>{text}</span>
}

export { BrandTitle }
