import * as React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { getStoredToken, removeStoredToken, setStoredToken, getMe, logout as apiLogout } from "@/services/authService"
import { normalizeRole } from "@/lib/roles"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(() => getStoredToken())
  const [loading, setLoading] = useState(true)

  // Initialize and verify authentication state on mount
  useEffect(() => {
    let isMounted = true

    // Remove legacy role preview overrides permanently
    localStorage.removeItem("orion_role_view")

    async function checkAuth() {
      const stored = getStoredToken()

      try {
        // Attempt session retrieval using either stored Bearer token or httpOnly cookie
        const response = await getMe(stored)
        if (isMounted) {
          const userData = response?.user || null
          if (userData) {
            // Disabled accounts are terminated immediately
            if (userData.status === "disabled") {
              removeStoredToken()
              setUser(null)
              setTokenState(null)
              return
            }
            const cachedPic = localStorage.getItem("user_profile_pic")
            if (cachedPic && !userData.profilePic && !userData.avatar) {
              userData.profilePic = cachedPic
            }
            setUser(userData)
          } else {
            setUser(null)
          }
        }
      } catch (err) {
        // If token is invalid/expired (401/403), wipe frontend token state
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          removeStoredToken()
          if (isMounted) {
            setUser(null)
            setTokenState(null)
          }
        } else if (!stored) {
          // If no token was stored and request failed, treat as unauthenticated
          if (isMounted) {
            setUser(null)
          }
        } else {
          // In offline or transient error scenario with stored token, keep token but clear user
          console.warn("Auth verification warning:", err?.message)
          if (isMounted) {
            setUser(null)
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void checkAuth()

    return () => {
      isMounted = false
    }
  }, [token])

  const loginUser = useCallback((newToken, userData) => {
    if (userData?.status === "disabled") {
      removeStoredToken()
      setUser(null)
      setTokenState(null)
      return
    }
    if (newToken) {
      setStoredToken(newToken)
      setTokenState(newToken)
    }
    if (userData) {
      setUser(userData)
    }
  }, [])

  const logoutUser = useCallback(async () => {
    try {
      await apiLogout(token)
    } catch (e) {
      console.warn("Logout request completed with local cleanup", e?.message)
    } finally {
      // Clear frontend session state unconditionally
      removeStoredToken()
      localStorage.removeItem("user_profile_pic")
      setTokenState(null)
      setUser(null)
    }
  }, [token])

  // Derive canonical normalized role without mutating backend user.role
  const normalizedRole = useMemo(() => {
    return normalizeRole(user?.role)
  }, [user?.role])

  // Preserved permissions array from backend user object
  const permissions = useMemo(() => {
    return Array.isArray(user?.permissions) ? user.permissions : []
  }, [user?.permissions])

  const value = useMemo(
    () => ({
      user,
      token,
      normalizedRole,
      permissions,
      isAuthenticated: Boolean(user),
      loading,
      loginUser,
      logoutUser,
      setUser,
    }),
    [user, token, normalizedRole, permissions, loading, loginUser, logoutUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
