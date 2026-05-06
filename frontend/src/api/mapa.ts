import api from './client'

export interface ObraMapa {
  id: number
  codigo: string
  nome: string
  cliente: {
    id: number
    nome: string
    logotipo_url: string | null
  }
  local_execucao: string | null
  latitude: number | null
  longitude: number | null
  status: 'em_execucao' | 'concluido' | 'mobilizacao' | 'aguardando'
  campanhas_total: number
  campanhas_ativas: number
  rdos_mes_atual: number
  metros_executados_mes: number
}

export interface KPIsGlobais {
  obras_ativas: number
  campanhas_em_execucao: number
  rdos_aprovados_mes: number
  metros_executados_mes: number
}

export const mapaAPI = {
  listObras: () => api.get<ObraMapa[]>('/mapa/obras').then((r) => r.data),
  getKPIs:   () => api.get<KPIsGlobais>('/mapa/kpis-globais').then((r) => r.data),
}
