import * as React from "react"
import { AuthHeader } from "./AuthHeader"
import { AuthBrandPanel } from "./AuthBrandPanel"

/**
 * AuthLayout
 * Split-screen layout for authentication pages matching the reference design.
 * On desktop (lg+), renders side-by-side: brand panel on left, form on right.
 * On mobile/tablet, stacks gracefully with a compact visual banner or focused container.
 */
export function AuthLayout({
  pageVariant = "exterior", // "exterior" (login) or "interior" (register)
  children,
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Top Header bar with Home button and ModeToggle */}
      <AuthHeader />

      {/* Main card or split container */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl xl:max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch bg-card border border-border/80 rounded-3xl p-3 sm:p-4 lg:p-6 shadow-xl dark:shadow-2xl dark:shadow-black/50">
          {/* Left panel - Brand & Visual Storytelling */}
          <AuthBrandPanel
            pageVariant={pageVariant}
            className="hidden sm:flex"
          />

          {/* Right panel - Form Area */}
          <div className="flex flex-col justify-center px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
