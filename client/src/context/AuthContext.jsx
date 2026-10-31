import * as React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { getStoredToken, removeStoredToken, setStoredToken, getMe, logout as apiLogout } from "@/services/authService"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(() => getStoredToken())
  const [loading, setLoading] = useState(true)

  // Initialize and verify authentication state on mount
  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      const stored = getStoredToken()
      if (!stored) {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const response = await getMe(stored)
        if (isMounted) {
          const userData = response?.user || { email: "user@example.com" }
          const cachedPic = localStorage.getItem("user_profile_pic")
          if (cachedPic && !userData.profilePic && !userData.avatar) {
            userData.profilePic = cachedPic
          }
          setUser(userData)
        }
      } catch (err) {
        // If the token is invalid or expired, clear it
        console.warn("Auth token validation error or offline:", err?.message)
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          removeStoredToken()
          if (isMounted) {
            setUser(null)
            setTokenState(null)
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
      removeStoredToken()
      localStorage.removeItem("user_profile_pic")
      setTokenState(null)
      setUser(null)
    }
  }, [token])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token || user),
      loading,
      loginUser,
      logoutUser,
      setUser,
    }),
    [user, token, loading, loginUser, logoutUser]
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
