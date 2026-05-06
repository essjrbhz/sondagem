import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useQuery } from '@tanstack/react-query'
import { mapaAPI } from '../api/mapa'
import type { ObraMapa } from '../api/mapa'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  em_execucao: '#16A34A',
  mobilizacao: '#E6D352',
  aguardando:  '#9CA3AF',
  concluido:   '#6B7280',
}

const STATUS_LABEL: Record<string, string> = {
  em_execucao: 'Em Execução',
  mobilizacao: 'Mobilização',
  aguardando:  'Aguardando',
  concluido:   'Concluído',
}

const STATUS_BADGE: Record<string, string> = {
  em_execucao: 'bg-green-100 text-green-800',
  mobilizacao: 'bg-yellow-100 text-yellow-800',
  aguardando:  'bg-gray-100 text-gray-600',
  concluido:   'bg-gray-200 text-gray-700',
}

const STATUS_ORDER = ['em_execucao', 'mobilizacao', 'aguardando', 'concluido']

function createIcon(color: string) {
  return L.divIcon({
    html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 20 12 20s12-12 12-20C24 5.373 18.627 0 12 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>`,
    className: 'custom-marker',
    iconSize:   [24, 32] as [number, number],
    iconAnchor: [12, 32] as [number, number],
  })
}

function fmtMetros(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m'
}

// ── FlyToObra ─────────────────────────────────────────────────────────────────

function FlyToObra({ obra }: { obra: ObraMapa | null }) {
  const map = useMap()
  useEffect(() => {
    if (obra?.latitude != null && obra?.longitude != null) {
      map.flyTo([obra.latitude, obra.longitude], 10, { duration: 0.8 })
    }
  }, [obra, map])
  return null
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({ label, value, accentColor, icon }: {
  label: string
  value: string | number
  accentColor: string
  icon: React.ReactNode
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-card"
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      <div className="p-2 bg-gray-50 rounded-lg text-primary shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function MapaBrasil() {
  const [focusedObra, setFocusedObra] = useState<ObraMapa | null>(null)

  const {
    data: obras = [],
    isLoading: loadingObras,
    isError: errorObras,
  } = useQuery({
    queryKey: ['mapa-obras'],
    queryFn: mapaAPI.listObras,
  })

  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['mapa-kpis'],
    queryFn: mapaAPI.getKPIs,
  })

  const obrasSorted = [...obras].sort((a, b) => {
    const ia = STATUS_ORDER.indexOf(a.status)
    const ib = STATUS_ORDER.indexOf(b.status)
    return (ia - ib) || a.nome.localeCompare(b.nome, 'pt-BR')
  })

  const syncTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Mapa Operacional Geothra</h1>
          <p className="text-xs text-gray-400 mt-0.5">Atualizado em {syncTime}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          {loadingObras ? 'Carregando…' : `${obras.length} obras mapeadas`}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Obras em Operação"
          value={loadingKPIs ? '—' : (kpis?.obras_ativas ?? 0)}
          accentColor="#003440"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />
        <KPICard
          label="Campanhas em Execução"
          value={loadingKPIs ? '—' : (kpis?.campanhas_em_execucao ?? 0)}
          accentColor="#E6D352"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9"/>
              <circle cx="12" cy="12" r="5"/>
              <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
            </svg>
          }
        />
        <KPICard
          label="RDOs Aprovados (mês)"
          value={loadingKPIs ? '—' : (kpis?.rdos_aprovados_mes ?? 0)}
          accentColor="#16A34A"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <KPICard
          label="Metros Executados (mês)"
          value={loadingKPIs ? '—' : fmtMetros(kpis?.metros_executados_mes ?? 0)}
          accentColor="#B29312"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 20h18"/>
              <rect x="5" y="12" width="3" height="8" rx="0.5"/>
              <rect x="10.5" y="7" width="3" height="13" rx="0.5"/>
              <rect x="16" y="3" width="3" height="17" rx="0.5"/>
            </svg>
          }
        />
      </div>

      {/* Map + List */}
      <div className="flex gap-4" style={{ height: 500 }}>

        {/* Mapa */}
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-card">
          {loadingObras ? (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
              Carregando mapa…
            </div>
          ) : errorObras ? (
            <div className="h-full flex items-center justify-center bg-red-50 text-red-500 text-sm">
              Erro ao carregar obras
            </div>
          ) : (
            <MapContainer
              center={[-15.7942, -47.8822]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToObra obra={focusedObra} />
              {obras.map((obra) => (
                <Marker
                  key={obra.id}
                  position={[obra.latitude!, obra.longitude!]}
                  icon={createIcon(STATUS_COLOR[obra.status] ?? '#9CA3AF')}
                >
                  <Popup maxWidth={260} autoPan>
                    <div style={{ minWidth: 200 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#003440', margin: '0 0 2px' }}>
                        {obra.nome}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: 11, margin: '0 0 4px' }}>{obra.codigo}</p>
                      <p style={{ color: '#374151', fontSize: 13, margin: '0 0 6px' }}>{obra.cliente.nome}</p>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 9999,
                        fontSize: 11, fontWeight: 600,
                        background: obra.status === 'em_execucao' ? '#dcfce7' : obra.status === 'mobilizacao' ? '#fef9c3' : '#f3f4f6',
                        color: obra.status === 'em_execucao' ? '#166534' : obra.status === 'mobilizacao' ? '#854d0e' : '#4b5563',
                      }}>
                        {STATUS_LABEL[obra.status] ?? obra.status}
                      </span>
                      <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 6 }}>
                        {obra.campanhas_ativas} campanha{obra.campanhas_ativas !== 1 ? 's' : ''} ativa{obra.campanhas_ativas !== 1 ? 's' : ''}
                      </p>
                      {obra.local_execucao && (
                        <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{obra.local_execucao}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Lista lateral */}
        <div className="w-72 shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
            <p className="text-sm font-semibold text-primary">Obras Mapeadas</p>
            <p className="text-xs text-gray-400">{obras.length} locais</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingObras ? (
              <div className="p-4 text-center text-gray-400 text-sm">Carregando…</div>
            ) : (
              obrasSorted.map((obra) => (
                <button
                  key={obra.id}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-primary-50 ${
                    focusedObra?.id === obra.id ? 'bg-primary-50 border-l-2 border-primary' : ''
                  }`}
                  onClick={() => setFocusedObra(obra)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate leading-tight">{obra.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{obra.codigo}</p>
                      <p className="text-xs text-gray-500 truncate">{obra.cliente.nome}</p>
                    </div>
                    <span
                      className="shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                      style={{ backgroundColor: STATUS_COLOR[obra.status] ?? '#9CA3AF' }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[obra.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[obra.status] ?? obra.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {obra.campanhas_total} campanha{obra.campanhas_total !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Legenda */}
          <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Legenda</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[k] }} />
                  <span className="text-xs text-gray-500">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
