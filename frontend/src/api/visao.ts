import api from './client'

export interface KPIs {
  campanhas_ativas: number
  rdos_total: number
  metros_executados_total: number
  obras_ativas: number
}

export interface AlertaItem {
  id: number
  label: string
  subtitulo: string | null
}

export interface Alerta {
  tipo: 'campanha_sem_rdo' | 'contrato_vencendo' | 'equipamento_ocioso' | 'cliente_sem_atividade'
  severidade: 'alta' | 'media' | 'baixa'
  titulo: string
  detalhe: string | null
  count: number
  items: AlertaItem[]
}

export interface CampanhaAtiva {
  id: number
  codigo: string
  descricao: string | null
  cliente_nome: string
  obra_nome: string
  obra_codigo: string | null
  equipamento_nome: string | null
  furos_planejados: number
  furos_executados: number
  metros_planejados: number
  metros_executados: number
  ultimo_rdo_data: string | null
  ultimo_rdo_dias_atras: number | null
  data_inicio: string | null
  data_termino: string | null
}

export const visaoAPI = {
  getKPIs: () =>
    api.get<KPIs>('/visao/kpis').then(r => r.data),
  getAlertas: () =>
    api.get<{ alertas: Alerta[] }>('/visao/alertas').then(r => r.data.alertas),
  getCampanhasAtivas: () =>
    api.get<{ campanhas: CampanhaAtiva[] }>('/visao/campanhas-ativas').then(r => r.data.campanhas),
}
