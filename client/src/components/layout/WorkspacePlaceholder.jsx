import * as React from "react"
import {
  Sparkles,
  Shield,
  Briefcase,
  Users,
} from "lucide-react"

/**
 * WorkspacePlaceholder renders the neutral, polished Phase 0 foundation workspace
 * faithfully reflecting Image 1 wireframe layouts for Admin, Staff, and Customer shells.
 */
export default function WorkspacePlaceholder({ currentRole = "admin" }) {
  // Role-specific titles & descriptions
  const contentMap = {
    admin: {
      heading: "Welcome to ORION",
      subheading: "Manage your subscriptions, billing and growth from one place.",
    },
    staff: {
      heading: "Welcome to ORION",
      subheading: "Your workspace for subscriptions and billing operations.",
    },
    customer: {
      heading: "Welcome to ORION",
      subheading: "View and manage your subscriptions, billing details and account settings.",
    },
  }

  const { heading, subheading } = contentMap[currentRole] || contentMap.admin

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      {/* Workspace Header */}
      <div>
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
          {heading}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
          {subheading}
        </p>
      </div>

      {/* Skeletons Layout Variant A: Admin Application (4 cards + wide card + 2 bottom split cards) */}
      {currentRole === "admin" && (
        <div className="space-y-6">
          {/* Top 4 Summary Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-[#668CFF]/30"
              >
                <div className="size-8 rounded-xl bg-[#EEF3FF] dark:bg-[#111827] flex items-center justify-center text-[#668CFF] mb-4 ring-1 ring-[#668CFF]/20">
                  <Sparkles className="size-4" />
                </div>
                <div className="h-3 w-24 rounded-full bg-muted/90 mb-2.5 animate-pulse" />
                <div className="h-2 w-36 rounded-full bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Large Middle Placeholder Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="size-16 rounded-full bg-muted/80 shrink-0 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 rounded-full bg-muted/90 animate-pulse" />
                <div className="h-2.5 w-72 rounded-full bg-muted/60 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="h-2.5 w-full rounded-full bg-muted/40 animate-pulse" />
              <div className="h-2.5 w-5/6 rounded-full bg-muted/30 animate-pulse" />
              <div className="h-2.5 w-3/4 rounded-full bg-muted/20 animate-pulse" />
            </div>
          </div>

          {/* 2 Bottom Split Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted/80 shrink-0 animate-pulse" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-32 rounded-full bg-muted/90 animate-pulse" />
                    <div className="h-2 w-48 rounded-full bg-muted/50 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2.5 pt-2">
                  <div className="h-2 w-full rounded-full bg-muted/40 animate-pulse" />
                  <div className="h-2 w-4/5 rounded-full bg-muted/30 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeletons Layout Variant B: Internal Staff Application (3 cards + middle card + 2 list cards) */}
      {currentRole === "staff" && (
        <div className="space-y-6">
          {/* Top 3 Summary Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-[#668CFF]/30"
              >
                <div className="size-8 rounded-xl bg-[#EEF3FF] dark:bg-[#111827] flex items-center justify-center text-[#668CFF] mb-4 ring-1 ring-[#668CFF]/20">
                  <Layers className="size-4" />
                </div>
                <div className="h-3 w-28 rounded-full bg-muted/90 mb-2.5 animate-pulse" />
                <div className="h-2 w-36 rounded-full bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Middle Placeholder Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-14 rounded-full bg-muted/80 shrink-0 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 rounded-full bg-muted/90 animate-pulse" />
                <div className="h-2.5 w-64 rounded-full bg-muted/50 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="h-2.5 w-4/5 rounded-full bg-muted/40 animate-pulse" />
              <div className="h-2.5 w-3/5 rounded-full bg-muted/30 animate-pulse" />
            </div>
          </div>

          {/* Bottom 2 List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((cardIdx) => (
              <div
                key={cardIdx}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-muted/80 shrink-0 animate-pulse" />
                  <div className="h-3 w-28 rounded-full bg-muted/90 animate-pulse" />
                </div>
                <div className="space-y-3 pt-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-[#668CFF]/60 shrink-0" />
                      <div className="h-2 w-3/4 rounded-full bg-muted/60 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeletons Layout Variant C: Customer Application (Large hero + 3 horizontal cards + 2 split cards) */}
      {currentRole === "customer" && (
        <div className="space-y-6">
          {/* Top Hero Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="size-16 rounded-full bg-muted/80 shrink-0 animate-pulse" />
              <div className="space-y-2.5 flex-1">
                <div className="h-4 w-52 rounded-full bg-muted/90 animate-pulse" />
                <div className="h-2.5 w-80 rounded-full bg-muted/60 animate-pulse" />
              </div>
            </div>
          </div>

          {/* 3 Middle Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs"
              >
                <div className="size-8 rounded-xl bg-[#EEF3FF] dark:bg-[#111827] flex items-center justify-center text-[#668CFF] mb-4 ring-1 ring-[#668CFF]/20">
                  <Sparkles className="size-4" />
                </div>
                <div className="h-3 w-24 rounded-full bg-muted/90 mb-2 animate-pulse" />
                <div className="h-2 w-32 rounded-full bg-muted/50 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Bottom 2 Split Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((cardIdx) => (
              <div
                key={cardIdx}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted/80 shrink-0 animate-pulse" />
                  <div className="h-3 w-32 rounded-full bg-muted/90 animate-pulse" />
                </div>
                <div className="space-y-2 pt-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-[#A9C4FF] shrink-0" />
                      <div className="h-2 w-4/5 rounded-full bg-muted/60 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

