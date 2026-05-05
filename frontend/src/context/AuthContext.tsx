import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthUser {
  nome: string
  role: 'admin' | 'gerente' | 'tecnico'
  token: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (token: string, nome: string, role: AuthUser['role']) => void
  logout: () => void
  isAdmin: boolean
  isGerente: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function loadUser(): AuthUser | null {
  const token = localStorage.getItem('token')
  const nome  = localStorage.getItem('nome')
  const role  = localStorage.getItem('role') as AuthUser['role'] | null
  if (token && nome && role) return { token, nome, role }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const login = useCallback((token: string, nome: string, role: AuthUser['role']) => {
    localStorage.setItem('token', token)
    localStorage.setItem('nome',  nome)
    localStorage.setItem('role',  role)
    setUser({ token, nome, role })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('nome')
    localStorage.removeItem('role')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin:   user?.role === 'admin',
      isGerente: user?.role === 'admin' || user?.role === 'gerente',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
