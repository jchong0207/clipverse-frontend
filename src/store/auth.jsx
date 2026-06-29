import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await api.me()
        if (active) setUser(me)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const login = async (creds) => {
    const r = await api.login(creds)
    setUser(r.user)
    return r
  }

  const register = async (info) => {
    const r = await api.register(info)
    setUser(r.user)
    return r
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  // Re-fetch the current user (e.g. after the credit balance changes).
  const refresh = async () => {
    try {
      const me = await api.me()
      setUser(me)
      return me
    } catch {
      return null
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
