import * as React from "react"
import { useState, useEffect } from "react"
import { useLocation, Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import { useAuth } from "@/context/AuthContext"

/**
 * AppLayout
 * 
 * Reusable layout integrating:
 * - Admin: expanded collapsible Sidebar + Navbar with search
 * - Staff: compact icon-only Sidebar + Navbar with search
 * - Customer: No sidebar + horizontal Navbar with customer items
 *
 * Role determination is derived EXCLUSIVELY from the authenticated backend session
 * or the explicit route shell. No mock switching or local-storage overrides.
 */
export default function AppLayout({ children, role: explicitRole }) {
  const { normalizedRole } = useAuth()
  const location = useLocation()

  // Clean up any legacy preview override in localStorage immediately
  useEffect(() => {
    localStorage.removeItem("orion_role_view")
  }, [])

  const getDerivedRole = () => {
    if (explicitRole) {
      if (explicitRole === "internal_user" || explicitRole === "staff") return "staff"
      if (explicitRole === "user" || explicitRole === "customer") return "customer"
      return explicitRole
    }
    if (location.pathname.startsWith("/admin")) return "admin"
    if (location.pathname.startsWith("/staff")) return "staff"
    if (location.pathname.startsWith("/portal")) return "customer"

    if (normalizedRole === "admin") return "admin"
    if (normalizedRole === "internal_user") return "staff"
    if (normalizedRole === "user") return "customer"

    return "admin"
  }

  const [currentRole, setCurrentRole] = useState(getDerivedRole)

  useEffect(() => {
    setCurrentRole(getDerivedRole())
  }, [explicitRole, location.pathname, normalizedRole])

  // Sidebar states
  const [isAdminCollapsed, setIsAdminCollapsed] = useState(false)
  const [isStaffExpanded, setIsStaffExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname, location.search])

  const content = children ? children : <Outlet />

  const enhancedChildren = React.isValidElement(content)
    ? React.cloneElement(content, {
        currentRole,
      })
    : content

  return (
    <div className="min-h-screen bg-white dark:bg-background text-foreground flex font-sans transition-colors">
      {/* Admin Application: Expanded Collapsible Sidebar */}
      {currentRole === "admin" && (
        <Sidebar
          role="admin"
          isCollapsed={isAdminCollapsed}
          onToggleCollapse={() => setIsAdminCollapsed((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Internal Staff Application: Compact Icon-Only Sidebar (Expandable) */}
      {currentRole === "staff" && (
        <Sidebar
          role="staff"
          isCollapsed={!isStaffExpanded}
          onToggleCollapse={() => setIsStaffExpanded((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Customer Application: NO sidebar */}

      {/* Main Content Area with integrated Navbar */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar
          userRole={currentRole}
          showSearch={currentRole === "admin" || currentRole === "staff"}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        />
        <main className="flex-1 w-full">{enhancedChildren}</main>
      </div>
    </div>
  )
}
