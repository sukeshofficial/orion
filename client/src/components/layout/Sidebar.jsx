import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Boxes,
  PackageOpen,
  Receipt,
  ReceiptText,
  CreditCard,
  Percent,
  UserCog,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import OrionBrand from "./OrionBrand"

export const ADMIN_NAV_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "SALES",
    items: [
      { name: "Customers", href: "/dashboard?tab=customers", icon: Users },
      { name: "Quotations", href: "/dashboard?tab=quotations", icon: FileText },
    ],
  },
  {
    title: "SUBSCRIPTIONS",
    items: [
      { name: "Subscriptions", href: "/dashboard?tab=subscriptions", icon: CalendarDays },
      { name: "Plans", href: "/dashboard?tab=plans", icon: Boxes },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { name: "Products", href: "/dashboard?tab=products", icon: PackageOpen },
      { name: "Taxes", href: "/dashboard?tab=taxes", icon: Receipt },
    ],
  },
  {
    title: "BILLING",
    items: [
      { name: "Invoices", href: "/dashboard?tab=invoices", icon: ReceiptText },
      { name: "Payments", href: "/dashboard?tab=payments", icon: CreditCard },
      { name: "Discounts", href: "/dashboard?tab=discounts", icon: Percent },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { name: "Staff", href: "/dashboard?tab=staff", icon: UserCog },
      { name: "Settings", href: "/dashboard?tab=settings", icon: Settings },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { name: "Financial Analytics", href: "/dashboard?tab=analytics", icon: TrendingUp },
    ],
  },
]

export const STAFF_NAV_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "SALES",
    items: [
      { name: "Customers", href: "/dashboard?tab=customers", icon: Users },
      { name: "Quotations", href: "/dashboard?tab=quotations", icon: FileText },
    ],
  },
  {
    title: "SUBSCRIPTIONS",
    items: [
      { name: "Subscriptions", href: "/dashboard?tab=subscriptions", icon: CalendarDays },
      { name: "Plans", href: "/dashboard?tab=plans", icon: Boxes },
    ],
  },
  {
    title: "BILLING",
    items: [
      { name: "Invoices", href: "/dashboard?tab=invoices", icon: ReceiptText },
      { name: "Payments", href: "/dashboard?tab=payments", icon: CreditCard },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { name: "Settings", href: "/dashboard?tab=settings", icon: Settings },
    ],
  },
]

export default function Sidebar({
  role = "admin",
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const location = useLocation()
  const currentTab = new URLSearchParams(location.search).get("tab")

  const sections = role === "staff" ? STAFF_NAV_SECTIONS : ADMIN_NAV_SECTIONS

  const isItemActive = (href) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" && !currentTab
    }
    const itemTab = new URLSearchParams(href.split("?")[1] || "").get("tab")
    return currentTab === itemTab
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-[#111827] text-foreground select-none border-r border-border/80 transition-colors">
      {/* Sidebar Header */}
      <div
        className={`flex h-16 items-center border-b border-border/60 px-4 transition-all ${
          isCollapsed ? "justify-center px-2" : "justify-between"
        }`}
      >
        <OrionBrand collapsed={isCollapsed} surface="auto" />

        {/* Collapse toggle (desktop only) */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden md:flex size-7 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-xs dark:bg-[#111827] ${
              isCollapsed ? "absolute -right-3.5 z-40 bg-white dark:bg-[#111827]" : ""
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronLeft className="size-3.5" />
            )}
          </button>
        )}

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex md:hidden size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin"
        aria-label="Sidebar Navigation"
      >
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed ? (
              <h4 className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {section.title}
              </h4>
            ) : (
              <div className="mx-auto my-1 h-px w-6 bg-border/60" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isItemActive(item.href)

                return (
                  <div key={item.name} className="relative group">
                    <Link
                      to={item.href}
                      onClick={() => {
                        if (isMobileOpen && onCloseMobile) onCloseMobile()
                      }}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 ${
                        active
                          ? "bg-[#EFF6FF] text-[#2563EB] font-semibold dark:bg-[#2563EB]/20 dark:text-blue-300"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-foreground"
                      } ${isCollapsed ? "justify-center px-0 py-2.5" : ""}`}
                    >
                      <Icon
                        className={`size-4 shrink-0 ${
                          active
                            ? "text-[#2563EB] dark:text-blue-300"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex z-50 whitespace-nowrap rounded-md bg-[#0F172A] px-2.5 py-1 text-xs font-medium text-white shadow-xl">
                        {item.name}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role Indicator Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border/60">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 p-2.5 text-center">
            <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-[#2563EB]">
              {role === "staff" ? "ORION Staff" : "ORION Admin"}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {role === "staff" ? "Essential Operations" : "Full Platform Control"}
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 relative transition-all duration-200 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        <div
          className={`fixed top-0 bottom-0 z-30 transition-all duration-200 ease-in-out ${
            isCollapsed ? "w-[72px]" : "w-[240px]"
          }`}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Slide-out Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-xs flex-1 flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

