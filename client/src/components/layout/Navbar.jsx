
import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Home,
  LayoutGrid,
  Calendar,
  Package,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/components/theme/theme-provider"

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const dropdownRef = useRef(null)
  const userButtonRef = useRef(null)

  // Close menus whenever the route changes
  useEffect(() => {
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // User information
  const displayName =
    user?.name || user?.email?.split("@")[0] || "User"

  const userInitial = (displayName.charAt(0) || "U").toUpperCase()

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

  const displayUserName = user?.name || displayName

  const truncatedHandle =
    displayUserName.length > 13
      ? `${displayUserName.slice(0, 12)}…`
      : displayUserName

  // Navigation items
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  ]

  const isProfileActive = location.pathname === "/profile"

  // Outside click and Escape handling

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
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await logoutUser()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoggingOut(false)
    }
  }

  // Reusable navigation link styling
  const getNavLinkClass = (isActive) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${isActive
      ? "text-foreground font-semibold bg-foreground/[0.08] shadow-sm ring-1 ring-border/40"
      : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]"
    }`


  return (
    <header
      className="
        sticky top-0 z-40 w-full
        bg-background/70
        backdrop-blur-2xl
        supports-[backdrop-filter]:bg-background/60
        border-b border-border/40
        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
        transition-all duration-300
      "
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left section */}
          <div className="flex items-center gap-6 sm:gap-8">

            {/* Home */}
            <Link
              to="/dashboard"
              className="
                group flex items-center justify-center
                size-9 rounded-xl
                bg-black text-white
                dark:bg-white dark:text-black
                hover:opacity-85 active:scale-95
                transition-all shadow-sm shrink-0
              "
              aria-label="Home"
            >
              <Home className="size-4 transition-transform group-hover:scale-110" />
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-1 sm:gap-2"
              aria-label="Main navigation"
            >
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={getNavLinkClass(isActive)}
                  >
                    <Icon
                      className={`size-4 ${isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                        }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="
                flex items-center justify-center size-9
                rounded-xl
                border border-border/50
                bg-background/40
                backdrop-blur-md
                hover:bg-foreground/[0.06]
                text-muted-foreground hover:text-foreground
                transition-all
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-blue-500/50
                cursor-pointer
              "
              aria-label="Toggle theme"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Moon className="size-4 text-blue-400" />
              ) : (
                <Sun className="size-4 text-amber-500" />
              )}
            </button>

            {/* User Dropdown */}
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
                  backdrop-blur-md
                  ${isDropdownOpen || isProfileActive
                    ? "border-blue-300/50 bg-blue-500/[0.08] text-foreground"
                    : "border-border/50 bg-background/40 hover:bg-foreground/[0.05] text-foreground"
                  }
                `}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="size-6 sm:size-7 rounded-full object-cover shrink-0 border border-blue-200/60 dark:border-blue-800/60"
                  />
                ) : (
                  <span className="size-6 sm:size-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60">
                    {userInitial}
                  </span>
                )}

                <span className="font-medium max-w-[100px] sm:max-w-[130px] truncate text-foreground">
                  {truncatedHandle}
                </span>

                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="
                    absolute right-0 mt-2 w-48
                    rounded-2xl
                    border border-border/50
                    bg-background/80
                    backdrop-blur-2xl
                    p-1.5
                    shadow-xl shadow-black/10
                    ring-1 ring-border/20
                    animate-in fade-in-50 zoom-in-95
                    z-50 text-foreground
                  "
                  role="menu"
                >
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors ${isProfileActive
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-foreground hover:bg-foreground/[0.06] font-medium"
                      }`}
                    role="menuitem"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="size-4 rounded-full object-cover"
                      />
                    ) : (
                      <User className="size-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>My profile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="
                      w-full flex items-center gap-2.5
                      px-3 py-2 rounded-xl
                      text-xs sm:text-sm font-medium
                      text-red-600 dark:text-red-400
                      hover:bg-red-500/10
                      transition-colors mt-0.5 cursor-pointer
                      disabled:opacity-50
                    "
                    role="menuitem"
                  >
                    {loggingOut ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    <span>
                      {loggingOut ? "Signing out…" : "Sign out"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="
                md:hidden flex items-center justify-center
                size-9 rounded-xl
                border border-border/50
                bg-background/40
                backdrop-blur-md
                text-foreground hover:bg-foreground/[0.06]
                transition-all cursor-pointer
              "
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div
          className="
            md:hidden
            border-t border-border/40
            bg-background/80
            backdrop-blur-2xl
            px-4 pt-3 pb-4 space-y-1
            shadow-lg shadow-black/[0.03]
            animate-in fade-in-50 slide-in-from-top-2
          "
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3
                  px-3.5 py-2.5 rounded-xl
                  text-sm font-medium transition-all
                  ${isActive
                    ? "text-foreground font-semibold bg-foreground/[0.08]"
                    : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                  }
                `}
              >
                <Icon className="size-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
