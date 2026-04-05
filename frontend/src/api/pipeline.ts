import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

export interface PipelineAdim {
  adim_no: number
  baslik: string
  deger: number
  aciklama: string
}

export interface PipelineSonucu {
  matrah: number
  hesaplanan_kv: number
  yiakv: number
  odenecek_kv: number
  yiakv_uygulanmis: boolean
  kazanc_varsa_gruplari_atlanmis: boolean
  adimlar: PipelineAdim[]
  kalemler: Record<string, { istisna_tutari: number; hatalar: string[]; uyarilar: string[]; aciklama: string }>
}

export function usePipeline(calismaId: string | undefined) {
  return useMutation<PipelineSonucu, Error, void>({
    mutationFn: async () => {
      const { data } = await apiClient.post<PipelineSonucu>(`/calisma/${calismaId}/hesapla`)
      return data
    },
  })
}
