import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Alerta } from '../../api/visao'

const SEV_BORDER: Record<string, string> = {
  alta:  '#DC2626',
  media: '#D97706',
  baixa: '#9CA3AF',
}

const SEV_BADGE: Record<string, string> = {
  alta:  'bg-accent text-primary',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-gray-100 text-gray-600',
}

const SEV_LABEL: Record<string, string> = {
  alta:  'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

// ── Ícones ────────────────────────────────────────────────────────────────────

function IconRelogio() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" />
    </svg>
  )
}

function IconCalendario() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
      <circle cx="16" cy="16" r="4" fill="currentColor" stroke="none" opacity=".25" />
      <path d="M16 14v2l1 1" strokeLinecap="round" />
    </svg>
  )
}

function IconEngrenagem() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" strokeLinecap="round" />
    </svg>
  )
}

function IconPessoa() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="7" r="4" />
      <path d="M6 21v-2a6 6 0 0112 0v2" strokeLinecap="round" />
      <path d="M17 3l4 4M21 3l-4 4" strokeLinecap="round" />
    </svg>
  )
}

const TIPO_ICON: Record<string, JSX.Element> = {
  campanha_sem_rdo:       <IconRelogio />,
  contrato_vencendo:      <IconCalendario />,
  equipamento_ocioso:     <IconEngrenagem />,
  cliente_sem_atividade:  <IconPessoa />,
}

// ── Componente ────────────────────────────────────────────────────────────────

interface AlertaCardProps {
  alerta: Alerta
}

export function AlertaCard({ alerta }: AlertaCardProps) {
  const [expandido, setExpandido] = useState(false)
  const navigate = useNavigate()

  const borderColor = SEV_BORDER[alerta.severidade] ?? '#9CA3AF'
  const icon = TIPO_ICON[alerta.tipo] ?? <IconRelogio />

  function handleItemClick(itemId: number) {
    if (alerta.tipo === 'campanha_sem_rdo') navigate(`/campanhas/${itemId}`)
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      {/* Cabeçalho clicável */}
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setExpandido(e => !e)}
      >
        <span style={{ color: borderColor }}>{icon}</span>

        <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">
          {alerta.titulo}
        </span>

        <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${SEV_BADGE[alerta.severidade]}`}>
          {SEV_LABEL[alerta.severidade]}
        </span>

        <span
          className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: borderColor }}
        >
          {alerta.count}
        </span>

        <svg
          className="shrink-0 w-4 h-4 text-gray-400 transition-transform"
          style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" />
        </svg>
      </button>

      {/* Lista expandível */}
      {expandido && (
        <div className="border-t border-gray-100">
          {alerta.detalhe && (
            <p className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
              {alerta.detalhe}
            </p>
          )}
          <ul className="divide-y divide-gray-50">
            {alerta.items.map(item => (
              <li key={item.id}>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-start gap-2"
                  onClick={() => handleItemClick(item.id)}
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: borderColor }} />
                  <div>
                    <p className="text-sm font-medium text-gray-700 leading-tight">{item.label}</p>
                    {item.subtitulo && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.subtitulo}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
