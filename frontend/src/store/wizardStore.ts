import { create } from 'zustand'

interface Faz0Data {
  ticari_kar_zarar: number
}

interface Faz2Data {
  secilen_kalemler: string[]
  kapi_soru_cevaplari: Record<string, Record<string, string>>
}

interface WizardStore {
  activeCalismaId: string | null
  faz0: Faz0Data | null
  faz1: Record<string, boolean> | null
  faz2: Faz2Data | null
  setFaz0: (calismaId: string, data: Faz0Data) => void
  setFaz1: (calismaId: string, data: Record<string, boolean>) => void
  setFaz2: (calismaId: string, data: Faz2Data) => void
  // Belirli bir calismaId için güvenli okuma — farklı calisma ise null döner
  getFaz0: (calismaId: string) => Faz0Data | null
  getFaz1: (calismaId: string) => Record<string, boolean> | null
  getFaz2: (calismaId: string) => Faz2Data | null
  // Yeni generic API (yeni fazlar için)
  stepData: Record<string, unknown>
  setStepData: (key: string, data: unknown) => void
  getStepData: (key: string) => unknown
  reset: () => void
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  activeCalismaId: null,
  faz0: null,
  faz1: null,
  faz2: null,
  stepData: {},
  setFaz0: (calismaId, data) => set({ activeCalismaId: calismaId, faz0: data }),
  setFaz1: (calismaId, data) => set({ activeCalismaId: calismaId, faz1: data }),
  setFaz2: (calismaId, data) => set({ activeCalismaId: calismaId, faz2: data }),
  getFaz0: (calismaId) => get().activeCalismaId === calismaId ? get().faz0 : null,
  getFaz1: (calismaId) => get().activeCalismaId === calismaId ? get().faz1 : null,
  getFaz2: (calismaId) => get().activeCalismaId === calismaId ? get().faz2 : null,
  setStepData: (key, data) => set((state) => ({ stepData: { ...state.stepData, [key]: data } })),
  getStepData: (key) => get().stepData[key],
  reset: () => set({ activeCalismaId: null, faz0: null, faz1: null, faz2: null, stepData: {} }),
}))
