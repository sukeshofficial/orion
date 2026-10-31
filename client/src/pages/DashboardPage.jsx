import * as React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { User, Calendar, Package, ArrowRight, ShieldCheck } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const displayName = user?.name || user?.email?.split("@")[0] || "Customer"

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs mb-8 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800/60 mb-3">
              <ShieldCheck className="size-3.5" /> ForgeGrid Platform
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Access your workspace and manage your account with ease.
            </p>
          </div>

          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-xs transition shrink-0"
          >
            <User className="size-4" />
            <span>View Profile</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          to="/rental"
          className="group rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-blue-300 dark:hover:border-blue-800/60 transition-all"
        >
          <div className="size-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">Rentals</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Browse active clothing rentals, return schedules, and bookings.
          </p>
        </Link>

        <Link
          to="/products"
          className="group rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-blue-300 dark:hover:border-blue-800/60 transition-all"
        >
          <div className="size-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Package className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">Products</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Explore available designer catalogs and eco-friendly garments.
          </p>
        </Link>

        <Link
          to="/profile"
          className="group rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-blue-300 dark:hover:border-blue-800/60 transition-all"
        >
          <div className="size-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <User className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">Account Settings</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your personal information, security options, and password.
          </p>
        </Link>
      </div> */}
    </div>
  )
}
