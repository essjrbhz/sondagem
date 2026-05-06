import type { CampanhaAtiva } from '../../api/visao'

interface Props {
  campanha: CampanhaAtiva
  onClick: () => void
}

function fmtDias(dias: number | null): { texto: string; cor: string } {
  if (dias === null) return { texto: 'nunca', cor: '#DC2626' }
  if (dias === 0)    return { texto: 'hoje',  cor: '#16A34A' }
  if (dias <= 3)     return { texto: `${dias}d atrás`, cor: '#16A34A' }
  if (dias <= 7)     return { texto: `${dias}d atrás`, cor: '#D97706' }
  return { texto: `${dias}d atrás`, cor: '#DC2626' }
}

function BarraProgresso({ executados, planejados }: { executados: number; planejados: number }) {
  const pct = planejados > 0 ? Math.min(100, (executados / planejados) * 100) : 0
  const barClass = pct >= 50 ? 'bg-primary' : pct >= 25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">
        {executados} / {planejados} furos
      </p>
    </div>
  )
}

function IconEquip() {
  return (
    <svg className="w-3 h-3 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
            strokeLinecap="round" />
    </svg>
  )
}

export function CampanhaListItem({ campanha: c, onClick }: Props) {
  const { texto: diasTexto, cor: diasCor } = fmtDias(c.ultimo_rdo_dias_atras)

  return (
    <button
      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors grid gap-x-4 items-center"
      style={{ gridTemplateColumns: '2fr 1fr 1.4fr 0.8fr' }}
      onClick={onClick}
    >
      {/* Col 1: identificação */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
          {c.codigo}
          {c.descricao && (
            <span className="font-normal text-gray-500 ml-1.5">{c.descricao}</span>
          )}
        </p>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">
          {c.cliente_nome} › {c.obra_nome}
        </p>
      </div>

      {/* Col 2: equipamento */}
      <div className="min-w-0">
        {c.equipamento_nome ? (
          <div className="flex items-center gap-1.5">
            <IconEquip />
            <span className="text-[11px] text-gray-500 truncate">{c.equipamento_nome}</span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-300">—</span>
        )}
      </div>

      {/* Col 3: barra de progresso */}
      <BarraProgresso
        executados={c.furos_executados}
        planejados={c.furos_planejados}
      />

      {/* Col 4: último RDO */}
      <div className="text-right">
        <p className="text-sm font-semibold leading-tight" style={{ color: diasCor }}>
          {diasTexto}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">último RDO</p>
      </div>
    </button>
  )
}
