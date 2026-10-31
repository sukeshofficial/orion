import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Loader2,
  Search,
  Bell,
  CheckCircle2,
  Shield,
  Briefcase,
  Users,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/components/theme/theme-provider"
import OrionBrand from "./OrionBrand"

/**
 * Extended ORION Navbar
 * 
 * Configurable props:
 * - userRole: "admin" | "staff" | "customer"
 * - showSearch: boolean (defaults true for admin & staff)
 * - navigationItems: Array<{ name: string, href: string, icon?: any }>
 * - onToggleSidebar: () => void (for mobile sidebar drawer in admin/staff)
 */
export default function Navbar({
  userRole = "customer",
  showSearch,
  navigationItems,
  onToggleSidebar,
}) {
  const { user, logoutUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const dropdownRef = useRef(null)
  const userButtonRef = useRef(null)
  const notifRef = useRef(null)
  const searchInputRef = useRef(null)

  const isSearchVisible =
    showSearch !== undefined ? showSearch : userRole === "admin" || userRole === "staff"

  // Close menus on route change
  useEffect(() => {
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
    setIsNotificationsOpen(false)
  }, [location.pathname, location.search])

  // User display name & email
  const displayName =
    user?.name || user?.email?.split("@")[0] || "prithivi.coder76"
  const userEmail = user?.email || "prithivi.coder76@gmail.com"
  const userInitial = (displayName.charAt(0) || "P").toUpperCase()

  const avatarUrl =
    user?.profilePic ||
    user?.avatar ||
    user?.profile_avatar?.url ||
    user?.profile_avatar?.secure_url ||
    user?.avatarUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("user_profile_pic")
      : null) ||
    ""

  const truncatedHandle =
    displayName.length > 15 ? `${displayName.slice(0, 14)}…` : displayName

  // Dynamic route prefix based on role
  const rolePrefix =
    userRole === "admin"
      ? "/admin"
      : userRole === "staff" || userRole === "internal_user"
      ? "/staff"
      : "/portal"

  // Customer navigation items
  const defaultNavItems =
    userRole === "customer" || userRole === "user"
      ? [
          { name: "Dashboard", href: "/portal/dashboard" },
          { name: "Subscriptions", href: "/portal/subscriptions" },
          { name: "Invoices", href: "/portal/invoices" },
          { name: "Payments", href: "/portal/payments" },
          { name: "Profile", href: "/portal/profile" },
        ]
      : []

  const navItems = navigationItems || defaultNavItems

  const currentTab = new URLSearchParams(location.search).get("tab")

  const isItemActive = (href) => {
    const [itemPath, itemQuery] = href.split("?")
    const itemTab = new URLSearchParams(itemQuery || "").get("tab")
    if (location.pathname === itemPath) {
      if (!itemTab && !currentTab) return true
      return currentTab === itemTab
    }
    return false
  }

  const isProfileActive = location.pathname.endsWith("/profile")

  // Outside click & Escape handling
  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotificationsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
        setIsMobileMenuOpen(false)
        setIsSearchOpen(false)
        setIsNotificationsOpen(false)
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Auto focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [isSearchOpen])

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await logoutUser()
      navigate("/login", { replace: true })
    } catch (error) {
      console.error("Logout error:", error)
      navigate("/login", { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  // Quick navigation modules
  const searchableModules = [
    { name: "Dashboard", category: "Overview", href: `${rolePrefix}/dashboard` },
    { name: "Customers", category: "Sales", href: `${rolePrefix}/customers` },
    { name: "Quotations", category: "Sales", href: `${rolePrefix}/dashboard?tab=quotations` },
    { name: "Subscriptions", category: "Subscriptions", href: `${rolePrefix}/dashboard?tab=subscriptions` },
    { name: "Plans", category: "Subscriptions", href: `${rolePrefix}/dashboard?tab=plans` },
    { name: "Products", category: "Catalog", href: `${rolePrefix}/dashboard?tab=products` },
    { name: "Taxes", category: "Catalog", href: `${rolePrefix}/dashboard?tab=taxes` },
    { name: "Invoices", category: "Billing", href: `${rolePrefix}/dashboard?tab=invoices` },
    { name: "Payments", category: "Billing", href: `${rolePrefix}/dashboard?tab=payments` },
    { name: "Discounts", category: "Billing", href: `${rolePrefix}/dashboard?tab=discounts` },
    { name: "Staff Administration", category: "Administration", href: `${rolePrefix}/dashboard?tab=staff` },
    { name: "Settings", category: "Administration", href: `${rolePrefix}/dashboard?tab=settings` },
    { name: "Financial Analytics", category: "Reports", href: `${rolePrefix}/dashboard?tab=analytics` },
    { name: "My Profile", category: "Account", href: `${rolePrefix}/profile` },
  ]

  const filteredSearch = searchQuery.trim()
    ? searchableModules.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchableModules.slice(0, 6)

  return (
    <>
      <header
        className="
          sticky top-0 z-40 w-full
          bg-white/95 dark:bg-[#111827]/95
          backdrop-blur-md
          border-b border-border/80
          shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]
          transition-colors duration-200
        "
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Mobile Sidebar Toggle (for admin & staff) */}
              {onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-white text-muted-foreground hover:bg-muted hover:text-foreground md:hidden dark:bg-[#111827]"
                  aria-label="Open navigation sidebar"
                >
                  <Menu className="size-4" />
                </button>
              )}

              {/* Customer Logo or Breadcrumb for Admin/Staff */}
              {userRole === "customer" ? (
                <OrionBrand surface="auto" />
              ) : (
                <nav
                  aria-label="Breadcrumb"
                  className="flex items-center text-xs sm:text-sm font-medium text-muted-foreground"
                >
                  <span className="text-muted-foreground/60 mr-1.5">&lt;</span>
                  <Link
                    to={`${rolePrefix}/dashboard`}
                    className="hover:text-foreground transition-colors"
                  >
                    Overview
                  </Link>
                  <span className="mx-1.5 text-muted-foreground/40 font-light">/</span>
                  <span className="font-semibold text-foreground">
                    {currentTab
                      ? currentTab.charAt(0).toUpperCase() + currentTab.slice(1)
                      : location.pathname === "/profile"
                      ? "Profile"
                      : "Dashboard"}
                  </span>
                </nav>
              )}

              {/* Customer Horizontal Navigation (Center Left) */}
              {userRole === "customer" && navItems.length > 0 && (
                <nav
                  className="hidden md:flex items-center gap-6 ml-4"
                  aria-label="Customer main navigation"
                >
                  {navItems.map((item) => {
                    const active = isItemActive(item.href)

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`text-sm font-medium transition-colors relative py-1 ${
                          active
                            ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2563EB]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              )}
            </div>

            {/* Admin / Staff Center Search Bar */}
            {isSearchVisible && (
              <div className="flex-1 max-w-sm mx-4 hidden sm:block">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="group flex h-9 w-full items-center justify-between rounded-xl border border-border/70 bg-slate-50 px-3 text-xs text-muted-foreground transition-all hover:border-[#2563EB]/40 hover:bg-white dark:bg-[#0B0F19] dark:border-white/10 dark:hover:bg-[#111827]"
                >
                  <div className="flex items-center gap-2">
                    <Search className="size-3.5 text-muted-foreground group-hover:text-[#2563EB] transition-colors" />
                    <span>Search anything...</span>
                  </div>
                  <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border/60 bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-[#111827]">
                    <span className="text-[9px]">Ctrl</span> K
                  </kbd>
                </button>
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search button (Customer or Mobile) */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className={`flex size-9 items-center justify-center rounded-xl border border-border/60 bg-slate-50 text-muted-foreground hover:bg-[#EFF6FF] hover:text-[#2563EB] transition dark:bg-[#0B0F19] dark:border-white/10 ${
                  isSearchVisible ? "sm:hidden" : ""
                }`}
                aria-label="Search"
              >
                <Search className="size-4" />
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  className="relative flex size-9 items-center justify-center rounded-xl border border-border/60 bg-slate-50 text-muted-foreground hover:bg-[#EFF6FF] hover:text-[#2563EB] transition dark:bg-[#0B0F19] dark:border-white/10"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-[#2563EB] ring-2 ring-white dark:ring-[#111827]" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/80 bg-white p-4 shadow-xl dark:bg-[#111827] dark:border-white/10 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-white/10">
                      <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                      <span className="text-[11px] text-[#2563EB] font-medium bg-[#EFF6FF] px-2 py-0.5 rounded-full dark:bg-blue-950/60 dark:text-blue-300">
                        ORION Live
                      </span>
                    </div>
                    <div className="py-6 text-center">
                      <div className="mx-auto size-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center text-[#2563EB] mb-2">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">All caught up!</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                        No pending alerts or notifications at this moment.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-slate-50 text-muted-foreground hover:bg-[#EFF6FF] hover:text-[#2563EB] transition dark:bg-[#0B0F19] dark:border-white/10"
                aria-label="Toggle theme"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Moon className="size-4 text-blue-400" />
                ) : (
                  <Sun className="size-4 text-amber-500" />
                )}
              </button>

              {/* User Dropdown Pill matching Reference Screenshot */}
              <div className="relative">
                <button
                  ref={userButtonRef}
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className={`
                    flex items-center gap-2
                    pl-1.5 pr-2.5 py-1 rounded-full
                    border transition-all duration-200
                    text-xs sm:text-sm font-medium
                    select-none cursor-pointer
                    ${isDropdownOpen || isProfileActive
                      ? "border-[#2563EB]/40 bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-border/60 bg-slate-50 hover:bg-slate-100 text-foreground dark:bg-[#0B0F19] dark:border-white/10"
                    }
                  `}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="size-6 sm:size-7 rounded-full object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <span className="size-6 sm:size-7 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {userInitial}
                    </span>
                  )}

                  <span className="font-medium max-w-[100px] sm:max-w-[130px] truncate text-foreground">
                    {truncatedHandle}
                  </span>

                  <ChevronDown
                    className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu matching Profile Reference Screenshot */}
                {isDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="
                      absolute right-0 mt-2 w-56
                      rounded-2xl
                      border border-border/80
                      bg-white dark:bg-[#111827]
                      p-2
                      shadow-xl
                      ring-1 ring-border/20
                      animate-in fade-in zoom-in-95
                      z-50 text-foreground
                    "
                    role="menu"
                  >
                    {/* User profile card in flyout */}
                    <div className="flex items-center gap-2.5 px-2 py-2 mb-1 border-b border-border/60 dark:border-white/10">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="size-8 rounded-full object-cover shrink-0 border"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {userInitial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="space-y-0.5">
                      <Link
                        to={`${rolePrefix}/profile`}
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                          isProfileActive
                            ? "bg-[#EFF6FF] text-[#2563EB] font-semibold dark:bg-blue-950/40 dark:text-blue-300"
                            : "text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                        role="menuitem"
                      >
                        <User className="size-4 text-slate-500" />
                        <span>My Profile</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer disabled:opacity-50"
                        role="menuitem"
                      >
                        {loggingOut ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <LogOut className="size-4" />
                        )}
                        <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle for Customer navigation */}
              {userRole === "customer" && navItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="md:hidden flex items-center justify-center size-9 rounded-xl border border-border/60 text-foreground hover:bg-muted transition"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="size-4" />
                  ) : (
                    <Menu className="size-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Mobile Navigation Dropdown */}
        {isMobileMenuOpen && userRole === "customer" && navItems.length > 0 && (
          <div className="md:hidden border-t border-border/60 bg-white dark:bg-[#111827] px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const active = isItemActive(item.href)

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    active
                      ? "bg-[#EFF6FF] text-[#2563EB] font-semibold dark:bg-blue-950/40"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        )}
      </header>

      {/* Global Interactive Search Modal (Ctrl+K) */}
      {isSearchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border/80 bg-white p-3 shadow-2xl dark:bg-[#111827] dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 pb-3 border-b border-border/60 dark:border-white/10">
              <Search className="size-4 text-[#2563EB]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, sections, navigation..."
                className="flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {searchQuery ? "Matching Results" : "Quick Navigation"}
              </p>
              {filteredSearch.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No modules found matching &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                filteredSearch.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false)
                      navigate(item.href)
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs text-foreground hover:bg-[#EFF6FF] hover:text-[#2563EB] dark:hover:bg-[#0B0F19] transition text-left"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
                      {item.category}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between px-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
              <span>Navigate with ORION Search</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
