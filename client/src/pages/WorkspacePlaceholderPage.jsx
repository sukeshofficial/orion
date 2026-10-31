import * as React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function WorkspacePlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
        {Icon && (
          <div className="size-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-5">
            <Icon className="size-7" />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">{description}</p>
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs sm:text-sm font-semibold text-foreground transition"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Profile</span>
        </Link>
      </div>
    </div>
  )
}
