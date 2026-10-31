import * as React from "react"
import { useSearchParams, useLocation } from "react-router-dom"
import WorkspacePlaceholder from "@/components/layout/WorkspacePlaceholder"
import { useAuth } from "@/context/AuthContext"
import CustomerListPage from "@/pages/customers/CustomerListPage"
import ProductListPage from "@/pages/products/ProductListPage"
import TaxListPage from "@/pages/taxes/TaxListPage"
import PlanListPage from "@/pages/plans/PlanListPage"
import QuotationListPage from "@/pages/quotations/QuotationListPage"
import TemplateListPage from "@/pages/quotations/TemplateListPage"
import {
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
  HelpCircle,
  Clock,
} from "lucide-react"

const TAB_MODULES = {
  quotations: { title: "Quotations", subtitle: "Sales quotation management, pricing, and approvals", icon: FileText },
  subscriptions: { title: "Subscriptions", subtitle: "Active, paused, and recurring subscription lifecycles", icon: CalendarDays },
  plans: { title: "Plans", subtitle: "Tier configurations, billing intervals, and entitlements", icon: Boxes },
  products: { title: "Products", subtitle: "Product catalog, items, and pricing structures", icon: PackageOpen },
  taxes: { title: "Taxes", subtitle: "Tax rates, jurisdictions, and fiscal categories", icon: Receipt },
  invoices: { title: "Invoices", subtitle: "Generated invoices, billing schedules, and ledger entries", icon: ReceiptText },
  payments: { title: "Payments", subtitle: "Payment gateways, transactions, and settlement histories", icon: CreditCard },
  discounts: { title: "Discounts", subtitle: "Promotional campaigns, coupons, and discount matrix", icon: Percent },
  staff: { title: "Staff Administration", subtitle: "Internal staff members, operational seats, and permissions", icon: UserCog },
  settings: { title: "Platform Settings", subtitle: "Global workspace configuration, system defaults, and webhooks", icon: Settings },
  analytics: { title: "Financial Analytics", subtitle: "Recurring revenue, churn trends, and accounting reports", icon: TrendingUp },
  support: { title: "Support Center", subtitle: "Customer assistance, ticketing, and platform documentation", icon: HelpCircle },
}

export default function DashboardPage({ currentRole }) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { normalizedRole } = useAuth()
  const activeTab = searchParams.get("tab")

  const role =
    currentRole ||
    (location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/staff")
      ? "staff"
      : location.pathname.startsWith("/portal")
      ? "customer"
      : normalizedRole === "admin"
      ? "admin"
      : normalizedRole === "internal_user"
      ? "staff"
      : "customer")

  // Phase 2: Customers tab renders CustomerListPage
  if (activeTab === "customers") {
    return <CustomerListPage />
  }

  // Phase 3: Products & Taxes tabs
  if (activeTab === "products") {
    return <ProductListPage />
  }
  if (activeTab === "taxes") {
    return <TaxListPage />
  }

  // Phase 4: Plans tab
  if (activeTab === "plans") {
    return <PlanListPage />
  }

  // Phase 5: Quotations & Quotation Templates tabs
  if (activeTab === "quotations") {
    return <QuotationListPage />
  }
  if (activeTab === "quotation-templates") {
    return <TemplateListPage />
  }

  if (activeTab && TAB_MODULES[activeTab]) {
    const info = TAB_MODULES[activeTab]
    const Icon = info.icon

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-foreground sm:leading-[40px]">
            {info.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-[22px]">
            {info.subtitle}
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-12 text-center shadow-xs">
          <div className="size-12 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] mx-auto flex items-center justify-center mb-4 ring-1 ring-[#2563EB]/20">
            <Icon className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {info.title} Module
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
            This module shell is connected to the ORION Phase 0 navigation foundation.
            Production business logic will be integrated in subsequent phases.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 dark:bg-blue-950/60 dark:text-blue-300">
              <Clock className="size-3" />
              Phase 0 Visual Foundation Active
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      <WorkspacePlaceholder role={role} />
    </div>
  )
}
