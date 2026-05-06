import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppLayoutMinimal from '../components/layout/AppLayoutMinimal'
import { KPICard } from '../components/painel/KPICard'
import { AlertaCard } from '../components/painel/AlertaCard'
import { CampanhaListItem } from '../components/painel/CampanhaListItem'
import { visaoAPI } from '../api/visao'

function fmtMetros(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' m'
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
}

function IconAlerta() {
  return (
    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}

function IconCampanha() {
  return (
    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function VisaoEmpresa() {
  const navigate = useNavigate()

  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['painel-kpis'],
    queryFn:  visaoAPI.getKPIs,
    refetchInterval: 60_000,
  })

  const { data: alertas, isLoading: loadingAlertas } = useQuery({
    queryKey: ['painel-alertas'],
    queryFn:  visaoAPI.getAlertas,
    refetchInterval: 60_000,
  })

  const { data: campanhas, isLoading: loadingCampanhas } = useQuery({
    queryKey: ['painel-campanhas-ativas'],
    queryFn:  visaoAPI.getCampanhasAtivas,
    refetchInterval: 60_000,
  })

  const syncTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <AppLayoutMinimal>
      <div className="max-w-7xl mx-auto p-6 flex flex-col gap-8">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#003440' }}>
              Panorama Operacional
            </h1>
            <p className="text-sm text-gray-400 mt-1">Atualizado em {syncTime}</p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(0,52,64,0.07)', color: '#003440' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block shrink-0" />
            {loadingCampanhas ? '…' : `${campanhas?.length ?? 0} campanhas ativas`}
          </div>
        </div>

        {/* ── KPIs ─────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingKPIs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))
          ) : (
            <>
              <KPICard
                numero={kpis?.campanhas_ativas ?? '—'}
                label="Campanhas Ativas"
                cor="primary"
              />
              <KPICard
                numero={kpis?.rdos_total.toLocaleString('pt-BR') ?? '—'}
                label="RDOs Totais"
                cor="accent"
              />
              <KPICard
                numero={kpis ? fmtMetros(kpis.metros_executados_total) : '—'}
                label="Metros Executados"
                cor="gold"
              />
              <KPICard
                numero={kpis?.obras_ativas ?? '—'}
                label="Obras Ativas"
                cor="verde"
              />
            </>
          )}
        </section>

        {/* ── Alertas ──────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#003440' }}>
            <IconAlerta />
            Atenção Imediata
          </h2>

          {loadingAlertas ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : alertas && alertas.length > 0 ? (
            <div className="flex flex-col gap-2">
              {alertas.map((alerta, i) => (
                <AlertaCard key={`${alerta.tipo}-${i}`} alerta={alerta} />
              ))}
            </div>
          ) : (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
              }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" />
              </svg>
              Nenhum alerta no momento. Operação dentro do esperado.
            </div>
          )}
        </section>

        {/* ── Campanhas em Execução ─────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#003440' }}>
            <IconCampanha />
            Campanhas em Execução
            {!loadingCampanhas && (
              <span className="text-sm font-normal text-gray-400">
                ({campanhas?.length ?? 0})
              </span>
            )}
          </h2>

          {loadingCampanhas ? (
            <div className="bg-white rounded-lg shadow-sm flex flex-col gap-0 divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : campanhas && campanhas.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden divide-y divide-gray-100">
              {/* Cabeçalho da tabela */}
              <div
                className="hidden md:grid px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50"
                style={{ gridTemplateColumns: '2fr 1fr 1.4fr 0.8fr' }}
              >
                <span>Campanha</span>
                <span>Equipamento</span>
                <span>Furos</span>
                <span className="text-right">Último RDO</span>
              </div>

              {campanhas.map(campanha => (
                <CampanhaListItem
                  key={campanha.id}
                  campanha={campanha}
                  onClick={() => navigate(`/campanhas/${campanha.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400 text-sm">
              Nenhuma campanha em execução no momento.
            </div>
          )}
        </section>

      </div>
    </AppLayoutMinimal>
  )
}
