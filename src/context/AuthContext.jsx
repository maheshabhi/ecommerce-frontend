import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/constants/auth'
import { AuthContext } from '@/context/auth-context'
import { isTokenExpired } from '@/utils/jwt'

function getInitialAuthState() {
  const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
  const isValidToken = savedToken && !isTokenExpired(savedToken)

  if (!isValidToken) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    return { token: null, user: null }
  }

  const savedUser = localStorage.getItem(AUTH_USER_KEY)
  return {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,
  }
}

export function AuthProvider({ children }) {
  const [initialState] = useState(() => getInitialAuthState())
  const [token, setToken] = useState(initialState.token)
  const [user, setUser] = useState(initialState.user)
  const [isReady] = useState(true)

  const login = useCallback((nextToken, nextUser) => {
    if (!nextToken || isTokenExpired(nextToken)) {
      setToken(null)
      setUser(null)
      return
    }

    setToken(nextToken)
    setUser(nextUser ?? null)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const setUserProfile = useCallback((nextUser) => {
    setUser(nextUser ?? null)
  }, [])

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      return
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }, [token])

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(AUTH_USER_KEY)
      return
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }, [user])

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated: Boolean(token),
      token,
      user,
      login,
      logout,
      setUserProfile,
    }),
    [isReady, login, logout, setUserProfile, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
