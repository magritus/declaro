import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

export interface AnaKategoriPublic {
  id: number
  kod: string
  soru: string
  etiket: string
  bilgi: string | null
  grup: 'zarar_olsa_dahi' | 'kazanc_varsa' | 'gecmis_yil_zarari' | 'ilave' | 'hesaplanan_kv_indirimi'
  beyanname_kodlari: number[] | null
  sira: number
}

export function useAnaKategoriler() {
  return useQuery({
    queryKey: ['katalog', 'ana-kategoriler'],
    queryFn: () =>
      apiClient.get('/katalog/ana-kategoriler').then((r) => r.data as AnaKategoriPublic[]),
    staleTime: 5 * 60 * 1000, // 5 min cache
  })
}

export interface KatalogKalem {
  ic_kod: string
  baslik: string
  ana_kategori: string
  beyanname_bolumu: string
  yiakv_etkisi: string
  durum: string
  coklu_instance?: boolean
  dahili_ref?: string | null
  beyanname_kodlari?: { donem: number; kod: number }[]
}

export interface MatrisSatirBilesen {
  satir: string
  isaret: 1 | -1
}

export interface MatrisSatir {
  id: string
  etiket: string
  tip?: 'satir' | 'bolum' | 'ara_toplam' | 'dagilim_secim'
  bilesenler?: MatrisSatirBilesen[]
  grup?: string  // e.g. 'faaliyet_gideri'
}

export interface MatrisSutun {
  id: string
  etiket: string
  zorunlu?: boolean
  renk?: string
  hesapli?: boolean  // auto-computed column, no user input
}

export interface VeriGirisiAlani {
  id: string
  etiket: string
  tip: 'para' | 'tarih' | 'secenek' | 'evet_hayir' | 'metin' | 'sayi' | 'matris' | 'bolum' | 'uzlastirma'
  zorunlu: boolean
  secenekler?: { deger: string; etiket: string }[]
  yardim?: string
  varsayilan?: unknown
  satirlar?: MatrisSatir[]
  sutunlar?: MatrisSutun[]
  kaynak_alan?: string  // uzlastirma: which form field holds the dönem karı
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
  coklu_instance?: boolean
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
      if (!calismaId) throw new Error('calismaId is required')
      if (!icKod) throw new Error('icKod is required')
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
      if (!calismaId) throw new Error('calismaId is required')
      if (!icKod) throw new Error('icKod is required')
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
      if (!calismaId) throw new Error('calismaId is required')
      if (!icKod) throw new Error('icKod is required')
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
      if (!calismaId) throw new Error('calismaId is required')
      if (!icKod) throw new Error('icKod is required')
      await apiClient.put(
        `/calisma/${calismaId}/kalem/${icKod}/belgeler`,
        { durum }
      )
    },
  })
}
