import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

export interface KatalogKalem {
  ic_kod: string
  baslik: string
  ana_kategori: string
  beyanname_bolumu: string
  yiakv_etkisi: string
  durum: string
  beyanname_kodlari?: { donem: number; kod: number }[]
}

export interface VeriGirisiAlani {
  id: string
  etiket: string
  tip: 'para' | 'tarih' | 'secenek' | 'evet_hayir' | 'metin' | 'sayi'
  zorunlu: boolean
  secenekler?: string[]
  yardim?: string    // backend field name (help text)
  varsayilan?: unknown
}

export interface KChecklistMaddesi {
  id: string
  soru: string
  referans?: string  // backend field name
}

export interface BelgeMaddesi {
  no: number         // backend sends 'no' as integer
  baslik: string
  kategori: 'zorunlu' | 'destekleyici'
  detay?: string
  temin_yeri?: string
}

export interface HesaplamaSablonu {
  veri_girisi_alanlari: VeriGirisiAlani[]
}

export interface KalemSchema {
  ic_kod: string
  baslik: string
  kisa_aciklama?: string
  beyanname_kodlari?: { donem: number; kod: number }[]
  mevzuat_dayanagi?: string[]
  wizard_agaci?: {
    tetikleyici_soru?: string
    info_modal?: string
  }
  hesaplama_sablonu: HesaplamaSablonu
  k_checklist: KChecklistMaddesi[]
  belge_listesi: BelgeMaddesi[]
}

export interface HesapSonucu {
  ic_kod: string
  istisna_tutari: number
  ara_sonuclar: Record<string, number>
  hatalar: string[]
  uyarilar: string[]
  aciklama: string
}

export interface ChecklistDurum {
  [maddeId: string]: 'uygun' | 'eksik' | 'risk'
}

export interface BelgeDurum {
  [belgeNo: string]: {
    durum: 'uygun' | 'eksik'
    not: string
  }
}

export function useKatalogKalemler() {
  return useQuery<KatalogKalem[]>({
    queryKey: ['katalog', 'kalemler'],
    queryFn: async () => {
      const { data } = await apiClient.get<KatalogKalem[]>('/katalog/kalemler')
      return data
    },
    staleTime: 1000 * 60 * 60, // 1 hour — catalog rarely changes
  })
}

export interface KalemVeriResponse {
  girdi_verileri: Record<string, unknown> | null
  istisna_tutari: number | null
  ara_sonuclar: Record<string, number> | null
  k_checklist_durumu: ChecklistDurum | null
  belge_durumu: BelgeDurum | null
}

export function useKalemVeri(calismaId: string | undefined, icKod: string | undefined) {
  return useQuery<KalemVeriResponse>({
    queryKey: ['kalem-veri', calismaId, icKod],
    queryFn: async () => {
      const { data } = await apiClient.get<KalemVeriResponse>(
        `/calisma/${calismaId}/kalem/${icKod}/veri`
      )
      return data
    },
    enabled: !!calismaId && !!icKod,
  })
}

export function useKalemSchema(icKod: string | undefined) {
  return useQuery<KalemSchema>({
    queryKey: ['kalem-schema', icKod],
    queryFn: async () => {
      const { data } = await apiClient.get<KalemSchema>(`/katalog/kalemler/${icKod}`)
      return data
    },
    enabled: !!icKod,
  })
}

export function useHesapla(calismaId: string | undefined, icKod: string | undefined) {
  return useMutation<HesapSonucu, Error, Record<string, unknown>>({
    mutationFn: async (girdiVerileri) => {
      const { data } = await apiClient.post<HesapSonucu>(
        `/calisma/${calismaId}/kalem/${icKod}/hesapla`,
        { girdi_verileri: girdiVerileri }
      )
      return data
    },
  })
}

export function useSaveVeri(calismaId: string | undefined, icKod: string | undefined) {
  return useMutation<void, Error, Record<string, unknown>>({
    mutationFn: async (girdiVerileri) => {
      await apiClient.put(
        `/calisma/${calismaId}/kalem/${icKod}/veri`,
        { girdi_verileri: girdiVerileri }
      )
    },
  })
}

export function useUpdateChecklist(calismaId: string | undefined, icKod: string | undefined) {
  return useMutation<void, Error, ChecklistDurum>({
    mutationFn: async (durum) => {
      await apiClient.put(
        `/calisma/${calismaId}/kalem/${icKod}/checklist`,
        { durum }
      )
    },
  })
}

export function useUpdateBelgeler(calismaId: string | undefined, icKod: string | undefined) {
  return useMutation<void, Error, BelgeDurum>({
    mutationFn: async (durum) => {
      await apiClient.put(
        `/calisma/${calismaId}/kalem/${icKod}/belgeler`,
        { durum }
      )
    },
  })
}
