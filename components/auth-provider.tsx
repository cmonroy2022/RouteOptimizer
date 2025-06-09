"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  // Credenciales válidas
  const validCredentials = {
    userData: {
    },
  }

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem("routeoptimizer-user")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing saved user data:", error)
        localStorage.removeItem("routeoptimizer-user")
      }
    }
  }, [])

  const login = (email: string, password: string): boolean => {
    if (email === validCredentials.email && password === validCredentials.password) {
      const userData = validCredentials.userData
      setUser(userData)
      localStorage.setItem("routeoptimizer-user", JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("routeoptimizer-user")
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
