import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0"  width="72" height="36" fill="#E6D352" />
      <rect x="0" y="36" width="72" height="36" fill="#B29312" />
      <text x="36" y="46" textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif" fontWeight="700"
        fontSize="28" fill="white" letterSpacing="-1">GR</text>
    </svg>
  )
}

interface AppLayoutMinimalProps {
  children: ReactNode
}

export default function AppLayoutMinimal({ children }: AppLayoutMinimalProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f6] overflow-hidden">
      {/* Header */}
      <header
        className="h-12 flex items-center justify-between px-6 shrink-0"
        style={{ background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-white font-bold text-sm tracking-wide leading-none">GEOTHRA</p>
            <p className="text-[10px] font-medium tracking-widest uppercase leading-tight mt-0.5"
               style={{ color: '#E6D352' }}>
              Geologia &amp; Geotecnia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-white text-xs font-medium leading-none">{user?.nome}</p>
            <p className="text-[10px] capitalize leading-tight mt-0.5"
               style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
