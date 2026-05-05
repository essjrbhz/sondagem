import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ── Icons ──────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}

function IconTarget() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20h18" />
      <rect x="5" y="12" width="3" height="8" rx="0.5" />
      <rect x="10.5" y="7" width="3" height="13" rx="0.5" />
      <rect x="16" y="3" width="3" height="17" rx="0.5" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a5 5 0 0110 0v2" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 21v-2a4 4 0 00-3-3.87" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ── Logo GR ────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0"  width="72" height="36" fill="#E6D352" />
      <rect x="0" y="36" width="72" height="36" fill="#B29312" />
      <text
        x="36" y="46"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="28"
        fill="white"
        letterSpacing="-1"
      >GR</text>
    </svg>
  )
}

// ── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard',  label: 'Dashboard',  icon: <IconDashboard /> },
  { path: '/projetos',   label: 'Projetos',   icon: <IconFolder />    },
  { path: '/furos',      label: 'Furos',      icon: <IconTarget />    },
  { path: '/relatorios', label: 'Relatórios', icon: <IconChart />     },
]

const ADMIN_ITEMS = [
  { path: '/usuarios', label: 'Usuários', icon: <IconUsers /> },
]

// ── Componente ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS

  return (
    <aside className="w-60 h-screen bg-primary flex flex-col shrink-0 select-none">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-white/10 shrink-0">
        <Logo />
        <div>
          <p className="text-white font-bold text-sm tracking-wide leading-none">GEOTHRA</p>
          <p className="text-accent text-[10px] font-medium tracking-widest uppercase leading-tight mt-0.5">
            Geologia &amp; Geotecnia
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>

        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all
               border-l-[3px] pl-[9px] pr-3 ${
                isActive
                  ? 'bg-white/10 text-white border-accent'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`shrink-0 transition-colors ${isActive ? 'text-accent' : 'text-white/40'}`}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuário */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <span className="text-accent text-xs font-bold leading-none">
              {user?.nome?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{user?.nome}</p>
            <p className="text-white/40 text-xs capitalize leading-tight mt-0.5">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all"
        >
          <IconLogout />
          Sair
        </button>
      </div>
    </aside>
  )
}
