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
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "SALES",
    items: [
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Quotations", href: "/admin/quotations", icon: FileText },
    ],
  },
  {
    title: "SUBSCRIPTIONS",
    items: [
      { name: "Subscriptions", href: "/admin/dashboard?tab=subscriptions", icon: CalendarDays },
      { name: "Plans", href: "/admin/plans", icon: Boxes },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { name: "Products", href: "/admin/products", icon: PackageOpen },
      { name: "Taxes", href: "/admin/taxes", icon: Receipt },
    ],
  },
  {
    title: "BILLING",
    items: [
      { name: "Invoices", href: "/admin/dashboard?tab=invoices", icon: ReceiptText },
      { name: "Payments", href: "/admin/dashboard?tab=payments", icon: CreditCard },
      { name: "Discounts", href: "/admin/dashboard?tab=discounts", icon: Percent },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { name: "Staff", href: "/admin/dashboard?tab=staff", icon: UserCog },
      { name: "Settings", href: "/admin/dashboard?tab=settings", icon: Settings },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { name: "Financial Analytics", href: "/admin/dashboard?tab=analytics", icon: TrendingUp },
    ],
  },
]

export const STAFF_NAV_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "SALES",
    items: [
      { name: "Customers", href: "/staff/customers", icon: Users },
      { name: "Quotations", href: "/staff/quotations", icon: FileText },
    ],
  },
  {
    title: "SUBSCRIPTIONS",
    items: [
      { name: "Subscriptions", href: "/staff/dashboard?tab=subscriptions", icon: CalendarDays },
      { name: "Plans", href: "/staff/plans", icon: Boxes },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { name: "Products", href: "/staff/products", icon: PackageOpen },
      { name: "Taxes", href: "/staff/taxes", icon: Receipt },
    ],
  },
  {
    title: "BILLING",
    items: [
      { name: "Invoices", href: "/staff/dashboard?tab=invoices", icon: ReceiptText },
      { name: "Payments", href: "/staff/dashboard?tab=payments", icon: CreditCard },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { name: "Settings", href: "/staff/dashboard?tab=settings", icon: Settings },
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

  const isItemActive = (item) => {
    if (item.href.includes("?tab=")) {
      const itemTab = new URLSearchParams(item.href.split("?")[1]).get("tab")
      return location.pathname.endsWith("/dashboard") && currentTab === itemTab
    }
    // Sub-path match (e.g. /admin/customers matches /admin/customers/new)
    if (item.href.endsWith("/dashboard")) {
      return location.pathname.endsWith("/dashboard") && !currentTab
    }
    return location.pathname.startsWith(item.href)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-18" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand & Collapse Toggle Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/60">
          <OrionBrand collapsed={isCollapsed} />

          {/* Desktop Collapse Trigger */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="flex lg:hidden size-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2 select-none">
                  {section.title}
                </p>
              )}
              {isCollapsed && (
                <div className="h-px bg-sidebar-border/60 mx-2 my-2" />
              )}
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon
                const active = isItemActive(item)

                return (
                  <Link
                    key={itemIdx}
                    to={item.href}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile()
                    }}
                    title={isCollapsed ? item.name : undefined}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors relative
                      ${
                        active
                          ? "bg-[#EFF6FF] text-[#2563EB] font-semibold dark:bg-blue-950/60 dark:text-blue-400"
                          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      }
                      ${isCollapsed ? "justify-center px-0" : ""}
                    `}
                  >
                    <Icon
                      className={`size-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                        active
                          ? "text-[#2563EB] dark:text-blue-400"
                          : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}

                    {/* Active Indicator Strip */}
                    {active && !isCollapsed && (
                      <span className="absolute right-2 size-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer Role / Mode pill */}
        <div className="p-3 border-t border-sidebar-border/60">
          <div
            className={`flex items-center gap-2 p-2 rounded-xl bg-sidebar-accent/50 text-[11px] text-sidebar-foreground/70 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
            {!isCollapsed && (
              <span className="truncate font-medium capitalize">
                {role === "admin" ? "Admin Workspace" : "Staff Portal"}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
