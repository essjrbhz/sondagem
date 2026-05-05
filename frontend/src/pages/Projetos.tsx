import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

// ── Types ──────────────────────────────────────────────────────────────────

interface Projeto {
  id: number
  codigo: string
  nome: string
  cliente_nome: string
  sonda_id: number
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

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, d = 0) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

function AvancoBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-primary tabular-nums w-9 text-right">{pct}%</span>
    </div>
  )
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function Projetos() {
  const navigate  = useNavigate()
  const [search,       setSearch]       = useState('')
  const [filterUF,     setFilterUF]     = useState('')
  const [filterSonda,  setFilterSonda]  = useState('')

  const { data: projetos, isLoading } = useQuery<Projeto[]>({
    queryKey: ['projetos'],
    queryFn: () => api.get('/projetos/').then(r => r.data),
  })

  // Opções únicas para filtros
  const ufs = [...new Set((projetos ?? []).map(p => p.uf))].sort()
  const sondas = [
    ...new Map((projetos ?? []).map(p => [p.sonda_id, { id: p.sonda_id, nome: p.sonda_nome }])).values()
  ]

  const filtered = (projetos ?? []).filter(p => {
    if (search      && !`${p.codigo} ${p.nome} ${p.cliente_nome}`.toLowerCase().includes(search.toLowerCase())) return false
    if (filterUF    && p.uf !== filterUF) return false
    if (filterSonda && p.sonda_id !== Number(filterSonda)) return false
    return true
  })

  function limpar() {
    setSearch(''); setFilterUF(''); setFilterSonda('')
  }

  const temFiltro = search || filterUF || filterSonda

  return (
    <div className="flex flex-col gap-4">

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Buscar por código, nome ou cliente…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1 min-w-48"
        />
        <select value={filterUF} onChange={e => setFilterUF(e.target.value)} className="input w-32">
          <option value="">Todos UFs</option>
          {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
        <select value={filterSonda} onChange={e => setFilterSonda(e.target.value)} className="input w-48">
          <option value="">Todas as sondas</option>
          {sondas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        {temFiltro && (
          <button onClick={limpar} className="btn-ghost text-sm">Limpar</button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Lista de Projetos</p>
          {!isLoading && (
            <span className="section-label">{filtered.length} de {projetos?.length ?? 0} projetos</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/40">
                {['Código', 'Projeto', 'Cliente', 'Local', 'Sonda', 'Furos', 'Previsto', 'Realizado', 'Avanço'].map(h => (
                  <th key={h} className="text-left section-label px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 text-sm py-14">
                    Nenhum projeto encontrado
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50/70 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/furos?projeto=${p.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-primary group-hover:underline">
                      {p.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-800 max-w-[200px] truncate">
                    {p.nome}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 max-w-[140px] truncate">
                    {p.cliente_nome}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                    {p.cidade} / {p.uf}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                    {p.sonda_nome}
                  </td>

                  {/* Furos: concluído / execução / pendente (total) */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <span className="text-green-600 font-semibold">{p.furos_concluido}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-blue-500 font-semibold">{p.furos_em_execucao}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400">{p.furos_pendente}</span>
                      <span className="text-gray-300 ml-0.5">({p.total_furos})</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-gray-400 tabular-nums whitespace-nowrap">
                    {fmt(p.prof_prevista_total, 0)} m
                  </td>
                  <td className="px-4 py-3.5 text-primary font-medium tabular-nums whitespace-nowrap">
                    {fmt(p.prof_realizada_total, 0)} m
                  </td>
                  <td className="px-4 py-3.5">
                    <AvancoBar pct={p.avanco_pct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé com totais */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex flex-wrap gap-5 text-xs text-gray-500">
            <span>
              Total previsto:{' '}
              <strong className="text-gray-700">
                {fmt(filtered.reduce((a, p) => a + p.prof_prevista_total, 0), 0)} m
              </strong>
            </span>
            <span>
              Total realizado:{' '}
              <strong className="text-primary">
                {fmt(filtered.reduce((a, p) => a + p.prof_realizada_total, 0), 0)} m
              </strong>
            </span>
            <span>
              Furos:{' '}
              <strong className="text-gray-700">
                {filtered.reduce((a, p) => a + p.total_furos, 0)}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
