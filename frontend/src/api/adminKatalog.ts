import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface AnaKategori {
  id: number
  kod: string
  soru: string
  etiket: string
  bilgi: string | null
  grup: 'zarar_olsa_dahi' | 'kazanc_varsa' | 'gecmis_yil_zarari'
  beyanname_kodlari: number[] | null
  sira: number
  aktif: boolean
}

export interface KalemWithOverride {
  ic_kod: string
  baslik: string
  ana_kategori: string
  beyanname_bolumu: string
  aktif: boolean
  sira: number | null
}

export interface WizardStepConfig {
  key: string
  label: string
  order: number
  aktif: boolean
}

// ── Ana Kategoriler ──────────────────────────────────────────────────────────

export function useAdminAnaKategoriler() {
  return useQuery<AnaKategori[]>({
    queryKey: ['admin', 'katalog', 'ana-kategoriler'],
    queryFn: () =>
      apiClient.get('/admin/katalog/ana-kategoriler').then((r) => r.data as AnaKategori[]),
  })
}

export function useCreateAnaKategori() {
  const queryClient = useQueryClient()
  return useMutation<AnaKategori, Error, Omit<AnaKategori, 'id'>>({
    mutationFn: (payload) =>
      apiClient.post('/admin/katalog/ana-kategoriler', payload).then((r) => r.data as AnaKategori),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'katalog', 'ana-kategoriler'] })
      queryClient.invalidateQueries({ queryKey: ['katalog', 'ana-kategoriler'] })
    },
  })
}

export function useUpdateAnaKategori() {
  const queryClient = useQueryClient()
  return useMutation<AnaKategori, Error, { id: number } & Partial<Omit<AnaKategori, 'id'>>>({
    mutationFn: ({ id, ...payload }) =>
      apiClient
        .put(`/admin/katalog/ana-kategoriler/${id}`, payload)
        .then((r) => r.data as AnaKategori),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'katalog', 'ana-kategoriler'] })
      queryClient.invalidateQueries({ queryKey: ['katalog', 'ana-kategoriler'] })
    },
  })
}

export function useReorderAnaKategoriler() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: number; sira: number }[]>({
    mutationFn: (items) =>
      apiClient.patch('/admin/katalog/ana-kategoriler/reorder', items).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'katalog', 'ana-kategoriler'] })
      queryClient.invalidateQueries({ queryKey: ['katalog', 'ana-kategoriler'] })
    },
  })
}

// ── Kalemler ─────────────────────────────────────────────────────────────────

export function useAdminKalemler() {
  return useQuery<KalemWithOverride[]>({
    queryKey: ['admin', 'katalog', 'kalemler'],
    queryFn: () =>
      apiClient.get('/admin/katalog/kalemler').then((r) => r.data as KalemWithOverride[]),
  })
}

export function useUpdateKalemOverride() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { ic_kod: string } & Partial<KalemWithOverride>>({
    mutationFn: ({ ic_kod, ...payload }) =>
      apiClient.patch(`/admin/katalog/kalemler/${ic_kod}`, payload).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'katalog', 'kalemler'] })
    },
  })
}

export function useBulkKalemAktif() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { ic_kodlar: string[]; aktif: boolean }>({
    mutationFn: (payload) =>
      apiClient.patch('/admin/katalog/kalemler/bulk', payload).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'katalog', 'kalemler'] })
    },
  })
}

// ── Wizard Steps ─────────────────────────────────────────────────────────────

export function useAdminWizardSteps() {
  return useQuery<WizardStepConfig[]>({
    queryKey: ['admin', 'katalog', 'wizard-steps'],
    queryFn: () =>
      apiClient.get('/admin/katalog/wizard-steps').then((r) => {
        // Backend returns { steps: [...] }
        const d = r.data
        return (Array.isArray(d) ? d : d?.steps ?? []) as WizardStepConfig[]
      }),
  })
}

export function useUpdateWizardSteps() {
  const queryClient = useQueryClient()
  return useMutation<WizardStepConfig[], Error, WizardStepConfig[]>({
    mutationFn: (payload) =>
      apiClient
        .put('/admin/katalog/wizard-steps', payload)
        .then((r) => r.data as WizardStepConfig[]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'katalog', 'wizard-steps'] })
    },
  })
}
