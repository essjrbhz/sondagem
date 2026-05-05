import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

// ── Types ──────────────────────────────────────────────────────────────────

interface Furo {
  id: number
  projeto_id: number
  id_furo: string
  tipo_furo: string | null
  coordenada_e: number | null
  coordenada_n: number | null
  prof_prevista_m: number | null
  prof_realizada_m: number | null
  data_inicio: string | null
  data_termino: string | null
  status: 'Pendente' | 'Em Execução' | 'Concluído' | 'Cancelado'
  ativo: boolean
  aviso_prof: string | null
}

interface ProjetoSimples {
  id: number
  codigo: string
  nome: string
}

// ── Transições de status ────────────────────────────────────────────────────

const TRANSICOES_TECNICO: Record<string, string[]> = {
  'Pendente':    ['Em Execução'],
  'Em Execução': ['Concluído'],
}
const TRANSICOES_GERENTE: Record<string, string[]> = {
  'Pendente':    ['Em Execução', 'Cancelado'],
  'Em Execução': ['Concluído', 'Cancelado', 'Pendente'],
  'Concluído':   ['Em Execução', 'Cancelado'],
  'Cancelado':   ['Pendente'],
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  'Pendente':    'badge-pendente',
  'Em Execução': 'badge-execucao',
  'Concluído':   'badge-concluido',
  'Cancelado':   'badge-cancelado',
}

function StatusBadge({ status }: { status: string }) {
  return <span className={STATUS_CLASS[status] ?? 'badge-cancelado'}>{status}</span>
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

function fmtDec(v: number | null, d = 2) {
  return v != null
    ? v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
    : '—'
}

function fmtDate(v: string | null) {
  return v ? new Date(v + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
}

// ── Modal base ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Modal Status ───────────────────────────────────────────────────────────

function ModalStatus({ furo, projetoLabel, role, loading, onClose, onConfirm }: {
  furo: Furo; projetoLabel: string; role: string
  loading: boolean; onClose: () => void; onConfirm: (s: string) => void
}) {
  const transicoes  = role === 'tecnico' ? TRANSICOES_TECNICO : TRANSICOES_GERENTE
  const disponiveis = transicoes[furo.status] ?? []
  const [novoStatus, setNovoStatus] = useState(disponiveis[0] ?? '')

  return (
    <Modal title={`Atualizar status — ${furo.id_furo}`} onClose={onClose}>
      <div className="flex flex-col gap-4">

        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 truncate">
          {projetoLabel}
        </div>

        <div className="flex items-end gap-4">
          <div>
            <p className="section-label mb-2">Status atual</p>
            <StatusBadge status={furo.status} />
          </div>

          {disponiveis.length > 0 && (
            <>
              <svg className="w-4 h-4 text-gray-300 mb-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <div className="flex-1">
                <label className="section-label mb-2 block">Novo status</label>
                <select
                  value={novoStatus}
                  onChange={e => setNovoStatus(e.target.value)}
                  className="input text-sm py-1.5"
                >
                  {disponiveis.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {disponiveis.length === 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Nenhuma transição disponível para seu perfil no status atual.
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={() => onConfirm(novoStatus)}
            disabled={!novoStatus || loading || disponiveis.length === 0}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal Progresso ────────────────────────────────────────────────────────

function ModalProgresso({ furo, loading, onClose, onConfirm }: {
  furo: Furo; loading: boolean; onClose: () => void
  onConfirm: (d: { prof_realizada_m?: number; data_inicio?: string; data_termino?: string }) => void
}) {
  const [profReal, setProfReal] = useState(furo.prof_realizada_m?.toString() ?? '')
  const [dataIni,  setDataIni]  = useState(furo.data_inicio  ?? '')
  const [dataTer,  setDataTer]  = useState(furo.data_termino ?? '')

  function handleSubmit() {
    const payload: any = {}
    if (profReal !== '') payload.prof_realizada_m = parseFloat(profReal)
    if (dataIni)         payload.data_inicio  = dataIni
    if (dataTer)         payload.data_termino = dataTer
    onConfirm(payload)
  }

  const excedeu = profReal && furo.prof_prevista_m != null && parseFloat(profReal) > furo.prof_prevista_m

  return (
    <Modal title={`Progresso — ${furo.id_furo}`} onClose={onClose}>
      <div className="flex flex-col gap-4">

        <div>
          <label className="label">Profundidade realizada (m)</label>
          <input
            type="number" step="0.01" min="0"
            value={profReal}
            onChange={e => setProfReal(e.target.value)}
            className="input"
            placeholder="0.00"
          />
          {furo.prof_prevista_m != null && (
            <p className={`text-xs mt-1 ${excedeu ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
              {excedeu
                ? `⚠ Excede a profundidade prevista de ${fmtDec(furo.prof_prevista_m)} m`
                : `Prevista: ${fmtDec(furo.prof_prevista_m)} m`
              }
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data início</label>
            <input
              type="date"
              value={dataIni}
              onChange={e => setDataIni(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Data término</label>
            <input
              type="date"
              value={dataTer}
              onChange={e => setDataTer(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Furos() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filterProjeto, setFilterProjeto] = useState(searchParams.get('projeto') ?? '')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [search,        setSearch]        = useState('')

  const [modalStatus,    setModalStatus]    = useState<Furo | null>(null)
  const [modalProgresso, setModalProgresso] = useState<Furo | null>(null)

  const { data: furos, isLoading } = useQuery<Furo[]>({
    queryKey: ['furos'],
    queryFn: () => api.get('/furos/').then(r => r.data),
  })

  const { data: projetos } = useQuery<ProjetoSimples[]>({
    queryKey: ['projetos'],
    queryFn: () => api.get('/projetos/').then(r => r.data),
  })

  const projetoMap = Object.fromEntries(
    (projetos ?? []).map(p => [p.id, `${p.codigo} — ${p.nome}`])
  )

  const mutStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/furos/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['furos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
      setModalStatus(null)
    },
  })

  const mutProgresso = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.patch(`/furos/${id}/progresso`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['furos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
      setModalProgresso(null)
    },
  })

  const filtered = (furos ?? []).filter(f => {
    if (filterProjeto && f.projeto_id !== Number(filterProjeto)) return false
    if (filterStatus  && f.status !== filterStatus)              return false
    if (search        && !f.id_furo.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleFilterProjeto(val: string) {
    setFilterProjeto(val)
    val ? setSearchParams({ projeto: val }) : setSearchParams({})
  }

  const temFiltro = search || filterProjeto || filterStatus

  return (
    <div className="flex flex-col gap-4">

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Buscar por ID do furo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1 min-w-40"
        />
        <select
          value={filterProjeto}
          onChange={e => handleFilterProjeto(e.target.value)}
          className="input w-72"
        >
          <option value="">Todos os projetos</option>
          {(projetos ?? []).map(p => (
            <option key={p.id} value={p.id}>{p.codigo} — {p.nome}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-44"
        >
          <option value="">Todos os status</option>
          {['Pendente', 'Em Execução', 'Concluído', 'Cancelado'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {temFiltro && (
          <button
            onClick={() => { setSearch(''); handleFilterProjeto(''); setFilterStatus('') }}
            className="btn-ghost text-sm"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Lista de Furos</p>
          {!isLoading && (
            <span className="section-label">{filtered.length} de {furos?.length ?? 0} furos</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/40">
                {['ID furo', 'Tipo', 'Projeto', 'Prevista', 'Realizada', 'Início', 'Término', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left section-label px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <Skeleton className="h-4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 text-sm py-14">
                    Nenhum furo encontrado
                  </td>
                </tr>
              ) : filtered.map(f => (
                <tr
                  key={f.id}
                  className={`hover:bg-gray-50/70 transition-colors ${f.aviso_prof ? 'border-l-2 border-amber-400' : ''}`}
                >
                  {/* ID furo + aviso */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-primary">{f.id_furo}</span>
                      {f.aviso_prof && (
                        <span title={f.aviso_prof}>
                          <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-gray-500">{f.tipo_furo ?? '—'}</td>

                  <td className="px-4 py-3.5 text-gray-500 max-w-[200px] truncate font-mono text-xs">
                    {projetoMap[f.projeto_id] ?? `#${f.projeto_id}`}
                  </td>

                  <td className="px-4 py-3.5 text-gray-400 tabular-nums whitespace-nowrap">
                    {fmtDec(f.prof_prevista_m)} m
                  </td>

                  <td className={`px-4 py-3.5 tabular-nums whitespace-nowrap font-medium ${f.aviso_prof ? 'text-amber-600' : 'text-primary'}`}>
                    {fmtDec(f.prof_realizada_m)} m
                  </td>

                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(f.data_inicio)}</td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(f.data_termino)}</td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={f.status} />
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModalProgresso(f)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors font-medium"
                      >
                        Progresso
                      </button>
                      <button
                        onClick={() => setModalStatus(f)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors font-medium"
                      >
                        Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé com aviso de furos com excesso de profundidade */}
        {!isLoading && filtered.some(f => f.aviso_prof) && (
          <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/60 flex items-center gap-2 text-xs text-amber-700">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
            </svg>
            {filtered.filter(f => f.aviso_prof).length} furo(s) com profundidade realizada acima da prevista
          </div>
        )}
      </div>

      {/* Modais */}
      {modalStatus && (
        <ModalStatus
          furo={modalStatus}
          projetoLabel={projetoMap[modalStatus.projeto_id] ?? `Projeto #${modalStatus.projeto_id}`}
          role={user?.role ?? 'tecnico'}
          loading={mutStatus.isPending}
          onClose={() => setModalStatus(null)}
          onConfirm={status => mutStatus.mutate({ id: modalStatus.id, status })}
        />
      )}

      {modalProgresso && (
        <ModalProgresso
          furo={modalProgresso}
          loading={mutProgresso.isPending}
          onClose={() => setModalProgresso(null)}
          onConfirm={data => mutProgresso.mutate({ id: modalProgresso.id, data })}
        />
      )}
    </div>
  )
}
