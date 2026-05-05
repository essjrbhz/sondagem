import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '../api/client'

// ── Types ──────────────────────────────────────────────────────────────────

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

interface PontoTemporal {
  data: string
  realizado_acumulado: number
  previsto_acumulado: number
}

interface ProdutividadeSonda {
  sonda_id: number
  sonda_nome: string
  total_projetos: number
  total_furos: number
  metragem_total: number
  media_m_por_furo: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
}

// ── KPI Card ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  iconBg: string
  progress?: number
}

function KpiCard({ label, value, sub, icon, iconBg, progress }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`kpi-icon shrink-0 ${iconBg}`}>{icon}</div>
      </div>

      {progress !== undefined && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progresso geral</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Status Bar ─────────────────────────────────────────────────────────────

interface StatusBarProps {
  label: string
  count: number
  total: number
  colorClass: string
  hex: string
}

function StatusBar({ label, count, total, colorClass, hex }: StatusBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="text-gray-400 tabular-nums">{count} <span className="text-gray-300">({pct}%)</span></span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-card rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium">{fmt(p.value, 1)} m</span>
        </p>
      ))}
    </div>
  )
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-card rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-primary">Metragem: <span className="font-medium">{fmt(payload[0].value, 1)} m</span></p>
      <p className="text-gray-500 mt-0.5">Furos: {payload[0].payload.total_furos}</p>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconTarget() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconRuler() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
      <path d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconDrill() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: resumo, isLoading: loadingResumo } = useQuery<Resumo>({
    queryKey: ['dashboard-resumo'],
    queryFn: () => api.get('/dashboard/resumo').then(r => r.data),
  })

  const { data: temporal, isLoading: loadingTemporal } = useQuery<PontoTemporal[]>({
    queryKey: ['dashboard-temporal'],
    queryFn: () => api.get('/dashboard/avanco-temporal').then(r => r.data),
  })

  const { data: produtividade, isLoading: loadingProd } = useQuery<ProdutividadeSonda[]>({
    queryKey: ['dashboard-produtividade'],
    queryFn: () => api.get('/dashboard/produtividade').then(r => r.data),
  })

  // ── Dados formatados para o gráfico temporal ──────────────────
  const temporalData = (temporal ?? []).map(p => ({
    ...p,
    dataFmt: formatDate(p.data),
  }))

  return (
    <div className="flex flex-col gap-6">

      {/* ── Row 1: KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loadingResumo ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : resumo ? (
          <>
            <KpiCard
              label="Avanço Geral"
              value={`${resumo.avanco_pct}%`}
              sub={`${fmt(resumo.prof_realizada_total, 1)} m realizados`}
              icon={<IconTarget />}
              iconBg="bg-primary/10 text-primary"
              progress={resumo.avanco_pct}
            />
            <KpiCard
              label="Metragem Prevista"
              value={`${fmt(resumo.prof_prevista_total, 0)} m`}
              sub={`Meta total do projeto`}
              icon={<IconRuler />}
              iconBg="bg-gold/10 text-gold"
            />
            <KpiCard
              label="Furos Concluídos"
              value={`${resumo.concluido}`}
              sub={`de ${resumo.total_furos} furos totais`}
              icon={<IconCheck />}
              iconBg="bg-green-50 text-green-600"
            />
            <KpiCard
              label="Em Execução"
              value={`${resumo.em_execucao}`}
              sub={`${resumo.pendente} pendentes`}
              icon={<IconDrill />}
              iconBg="bg-blue-50 text-blue-600"
            />
          </>
        ) : null}
      </div>

      {/* ── Row 2: Avanço Temporal + Status ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Área temporal — 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Avanço Temporal</p>
              <p className="section-label mt-0.5">metragem acumulada — realizado vs previsto</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-primary inline-block rounded" />
                Realizado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-gold inline-block rounded border-dashed" style={{ borderTop: '2px dashed #B29312', height: 0 }} />
                Previsto
              </span>
            </div>
          </div>

          {loadingTemporal ? (
            <Skeleton className="h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={temporalData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#003440" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#003440" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#B29312" stopOpacity={0.10} />
                    <stop offset="95%" stopColor="#B29312" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="dataFmt"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${fmt(v)}m`}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="previsto_acumulado"
                  name="Previsto"
                  stroke="#B29312"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="url(#gradPrev)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="realizado_acumulado"
                  name="Realizado"
                  stroke="#003440"
                  strokeWidth={2}
                  fill="url(#gradReal)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribuição de Status — 1/3 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 flex flex-col">
          <p className="text-sm font-semibold text-gray-800 mb-0.5">Status dos Furos</p>
          <p className="section-label mb-5">distribuição por situação</p>

          {loadingResumo ? (
            <div className="flex flex-col gap-4 flex-1">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : resumo ? (
            <div className="flex flex-col gap-5 flex-1 justify-center">
              <StatusBar label="Concluído"    count={resumo.concluido}   total={resumo.total_furos} colorClass="bg-green-500"  hex="#16A34A" />
              <StatusBar label="Em Execução"  count={resumo.em_execucao} total={resumo.total_furos} colorClass="bg-blue-500"   hex="#2563EB" />
              <StatusBar label="Pendente"     count={resumo.pendente}    total={resumo.total_furos} colorClass="bg-accent"     hex="#E6D352" />
              <StatusBar label="Cancelado"    count={resumo.cancelado}   total={resumo.total_furos} colorClass="bg-gray-400"   hex="#6B7280" />

              <div className="mt-2 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Total: <span className="font-semibold text-gray-600">{resumo.total_furos} furos</span>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Row 3: Produtividade por Sonda ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-800">Produtividade por Sonda</p>
          <p className="section-label mt-0.5">metragem total realizada · média por furo</p>
        </div>

        {loadingProd ? (
          <Skeleton className="h-48" />
        ) : produtividade && produtividade.length > 0 ? (
          <div className="flex gap-8 items-start">
            <ResponsiveContainer width="100%" height={192}>
              <BarChart
                data={produtividade}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="sonda_nome"
                  tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${fmt(v)}m`}
                  width={52}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="metragem_total" name="Metragem" fill="#003440" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Tabela lateral resumo */}
            <div className="shrink-0 min-w-[200px]">
              <table className="text-sm w-full">
                <thead>
                  <tr className="text-gray-400">
                    <th className="text-left section-label pb-2">Sonda</th>
                    <th className="text-right section-label pb-2">Furos</th>
                    <th className="text-right section-label pb-2">Média m/furo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {produtividade.map(s => (
                    <tr key={s.sonda_id}>
                      <td className="py-2 font-medium text-gray-700">{s.sonda_nome}</td>
                      <td className="py-2 text-right text-gray-500 tabular-nums">{s.total_furos}</td>
                      <td className="py-2 text-right font-semibold text-primary tabular-nums">{fmt(s.media_m_por_furo, 1)} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">Sem dados de produtividade</p>
        )}
      </div>

    </div>
  )
}
