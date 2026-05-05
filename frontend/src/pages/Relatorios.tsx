import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

// ── Types ──────────────────────────────────────────────────────────────────

interface Projeto {
  id: number
  codigo: string
  nome: string
  cliente_nome: string
  sonda_nome: string
  cidade: string
  uf: string
  total_furos: number
  furos_pendente: number
  furos_em_execucao: number
  furos_concluido: number
  furos_cancelado: number
  prof_prevista_total: number
  prof_realizada_total: number
  avanco_pct: number
}

interface Resumo {
  total_furos: number
  pendente: number
  em_execucao: number
  concluido: number
  cancelado: number
  prof_prevista_total: number
  prof_realizada_total: number
  avanco_pct: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, d = 0) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

function AvancoBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-primary tabular-nums">{pct}%</span>
    </div>
  )
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function Relatorios() {
  const { data: projetos, isLoading: loadingProj } = useQuery<Projeto[]>({
    queryKey: ['projetos'],
    queryFn: () => api.get('/projetos/').then(r => r.data),
  })

  const { data: resumo, isLoading: loadingRes } = useQuery<Resumo>({
    queryKey: ['dashboard-resumo'],
    queryFn: () => api.get('/dashboard/resumo').then(r => r.data),
  })

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const totais = (projetos ?? []).reduce(
    (acc, p) => ({
      furos:     acc.furos     + p.total_furos,
      concluido: acc.concluido + p.furos_concluido,
      execucao:  acc.execucao  + p.furos_em_execucao,
      pendente:  acc.pendente  + p.furos_pendente,
      previsto:  acc.previsto  + p.prof_prevista_total,
      realizado: acc.realizado + p.prof_realizada_total,
    }),
    { furos: 0, concluido: 0, execucao: 0, pendente: 0, previsto: 0, realizado: 0 }
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Cabeçalho — oculto na impressão, visível na tela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 flex items-center justify-between no-print">
        <div>
          <p className="text-sm font-semibold text-gray-800">Relatório Executivo de Sondagens</p>
          <p className="section-label mt-0.5">posição em {dataAtual}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" rx="1" />
          </svg>
          Imprimir / PDF
        </button>
      </div>

      {/* Cabeçalho de impressão — visível apenas ao imprimir */}
      <div className="print-header">
        <div className="flex items-center gap-4 mb-3">
          <svg width="44" height="44" viewBox="0 0 72 72" fill="none">
            <rect x="0" y="0"  width="72" height="36" fill="#E6D352" />
            <rect x="0" y="36" width="72" height="36" fill="#B29312" />
            <text x="36" y="46" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="28" fill="white" letterSpacing="-1">GR</text>
          </svg>
          <div>
            <p className="text-xl font-bold text-primary">GEOTHRA — Relatório Executivo de Sondagens</p>
            <p className="text-sm text-gray-500">Posição em {dataAtual}</p>
          </div>
        </div>
        <hr className="border-gray-300 mb-4" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loadingRes ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : resumo ? (
          <>
            <div className="kpi-card">
              <p className="kpi-label">Avanço Geral</p>
              <p className="kpi-value">{resumo.avanco_pct}%</p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${resumo.avanco_pct}%` }} />
              </div>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Metros Realizados</p>
              <p className="kpi-value">{fmt(resumo.prof_realizada_total, 1)} m</p>
              <p className="text-xs text-gray-400">de {fmt(resumo.prof_prevista_total, 0)} m previstos</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Furos Concluídos</p>
              <p className="kpi-value">{resumo.concluido}</p>
              <p className="text-xs text-gray-400">de {resumo.total_furos} furos totais</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Em Execução</p>
              <p className="kpi-value">{resumo.em_execucao}</p>
              <p className="text-xs text-gray-400">{resumo.pendente} pendentes</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Tabela detalhada por projeto */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Detalhamento por Projeto</p>
          {!loadingProj && (
            <span className="section-label">{projetos?.length ?? 0} projetos</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/40">
                {['Código', 'Projeto', 'Local', 'Sonda', 'Total', 'Concluídos', 'Execução', 'Pendentes', 'Previsto', 'Realizado', 'Avanço'].map(h => (
                  <th key={h} className="text-left section-label px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loadingProj ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : (projetos ?? []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">{p.codigo}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-800 max-w-[180px] truncate">{p.nome}</td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{p.cidade}/{p.uf}</td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{p.sonda_nome}</td>
                  <td className="px-4 py-3.5 text-center font-medium text-gray-700">{p.total_furos}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-green-600">{p.furos_concluido}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-blue-500">{p.furos_em_execucao}</td>
                  <td className="px-4 py-3.5 text-center text-gray-400">{p.furos_pendente}</td>
                  <td className="px-4 py-3.5 text-gray-400 tabular-nums whitespace-nowrap">{fmt(p.prof_prevista_total, 0)} m</td>
                  <td className="px-4 py-3.5 text-primary font-medium tabular-nums whitespace-nowrap">{fmt(p.prof_realizada_total, 0)} m</td>
                  <td className="px-4 py-3.5"><AvancoBar pct={p.avanco_pct} /></td>
                </tr>
              ))}
            </tbody>

            {/* Totais */}
            {!loadingProj && (projetos ?? []).length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-primary/5">
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold text-primary uppercase tracking-wide">
                    Total Geral
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{totais.furos}</td>
                  <td className="px-4 py-3 text-center font-bold text-green-600">{totais.concluido}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-500">{totais.execucao}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-400">{totais.pendente}</td>
                  <td className="px-4 py-3 font-bold text-gray-500 tabular-nums whitespace-nowrap">{fmt(totais.previsto, 0)} m</td>
                  <td className="px-4 py-3 font-bold text-primary tabular-nums whitespace-nowrap">{fmt(totais.realizado, 0)} m</td>
                  <td className="px-4 py-3">
                    {resumo && <AvancoBar pct={resumo.avanco_pct} />}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Rodapé */}
      <p className="text-xs text-gray-400 text-center py-2">
        Geothra Geologia &amp; Geotecnia · Relatório gerado em {dataAtual}
      </p>
    </div>
  )
}
