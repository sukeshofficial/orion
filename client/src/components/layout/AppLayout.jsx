import * as React from "react"
import Navbar from "./Navbar"

/**
 * Reusable layout providing the unified horizontal Navbar and clean page container.
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-background text-foreground flex flex-col font-sans transition-colors">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  )
}

