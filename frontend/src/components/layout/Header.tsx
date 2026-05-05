import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/projetos':   'Projetos',
  '/furos':      'Furos',
  '/relatorios': 'Relatórios',
  '/usuarios':   'Usuários',
}

export default function Header() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Sistema'

  // Data atual formatada em pt-BR
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center px-6 shrink-0 gap-4">
      <h1 className="flex-1 text-xl font-bold text-gray-900 tracking-tight capitalize">
        {title}
      </h1>

      <p className="text-xs text-gray-400 capitalize hidden md:block">
        {hoje}
      </p>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-2">
        {/* Indicador de sistema online */}
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-xs text-gray-400">Online</span>
      </div>
    </header>
  )
}
