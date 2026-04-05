import { create } from 'zustand'

interface Faz0Data {
  ticari_kar_zarar: number
  kkeg: number
  finansman_fonu: number
}

interface Faz2Data {
  secilen_kalemler: string[]
  kapi_soru_cevaplari: Record<string, Record<string, string>>
}

interface WizardStore {
  faz0: Faz0Data | null
  faz1: Record<string, boolean> | null
  faz2: Faz2Data | null
  setFaz0: (data: Faz0Data) => void
  setFaz1: (data: Record<string, boolean>) => void
  setFaz2: (data: Faz2Data) => void
  reset: () => void
}

export const useWizardStore = create<WizardStore>((set) => ({
  faz0: null,
  faz1: null,
  faz2: null,
  setFaz0: (data) => set({ faz0: data }),
  setFaz1: (data) => set({ faz1: data }),
  setFaz2: (data) => set({ faz2: data }),
  reset: () => set({ faz0: null, faz1: null, faz2: null }),
}))
