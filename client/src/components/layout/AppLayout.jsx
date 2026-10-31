import * as React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import { useAuth } from "@/context/AuthContext"

const RoleLayoutContext = createContext({
  currentRole: "admin",
  setRole: () => null,
})

export const useRoleLayout = () => useContext(RoleLayoutContext)

/**
 * AppLayout
 * 
 * Reusable layout integrating:
 * - Admin: expanded collapsible Sidebar + Navbar with search
 * - Staff: compact icon-only Sidebar + Navbar with search
 * - Customer: No sidebar + horizontal Navbar with customer items
 */
export default function AppLayout({ children }) {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  // Determine active role: URL query param > LocalStorage > user.role > default 'admin'
  const [currentRole, setCurrentRole] = useState(() => {
    const paramRole = searchParams.get("role")?.toLowerCase()
    if (paramRole && ["admin", "staff", "customer"].includes(paramRole)) {
      return paramRole
    }
    const savedRole = localStorage.getItem("orion_role_view")
    if (savedRole && ["admin", "staff", "customer"].includes(savedRole)) {
      return savedRole
    }
    if (user?.role && ["admin", "staff", "customer"].includes(user.role.toLowerCase())) {
      return user.role.toLowerCase()
    }
    return "admin"
  })

  useEffect(() => {
    const paramRole = searchParams.get("role")?.toLowerCase()
    if (paramRole && ["admin", "staff", "customer"].includes(paramRole)) {
      setCurrentRole(paramRole)
    }
  }, [searchParams])

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole)
    localStorage.setItem("orion_role_view", newRole)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("role", newRole)
    setSearchParams(nextParams, { replace: true })
  }

  // Sidebar states
  const [isAdminCollapsed, setIsAdminCollapsed] = useState(false)
  const [isStaffExpanded, setIsStaffExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname, location.search])

  const enhancedChildren = React.isValidElement(children)
    ? React.cloneElement(children, {
        currentRole,
        onSelectRole: handleRoleChange,
      })
    : children

  return (
    <RoleLayoutContext.Provider
      value={{ currentRole, setRole: handleRoleChange }}
    >
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
            onRoleChange={handleRoleChange}
          />
          <main className="flex-1 w-full">{enhancedChildren}</main>
        </div>
      </div>
    </RoleLayoutContext.Provider>
  )
}
