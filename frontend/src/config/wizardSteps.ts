export interface WizardStepConfig {
  key: string      // URL anahtarı: "donem-acilis"
  label: string    // Sidebar etiketi: "Dönem Açılışı"
  order: number    // Sıra numarası (0, 1, 2, ...)
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  { key: 'donem-acilis', label: 'Dönem Açılışı', order: 0 },
  { key: 'ana-kategori', label: 'Ana Kategori', order: 1 },
  { key: 'alt-kategori', label: 'Alt Kategori', order: 2 },
]

// Verilen key'den sonraki adımı döndür. Yoksa null.
export function getNextStep(currentKey: string): WizardStepConfig | null {
  const current = WIZARD_STEPS.find(s => s.key === currentKey)
  if (!current) return null
  return WIZARD_STEPS.find(s => s.order === current.order + 1) ?? null
}

// Verilen key'den önceki adımı döndür. Yoksa null.
export function getPrevStep(currentKey: string): WizardStepConfig | null {
  const current = WIZARD_STEPS.find(s => s.key === currentKey)
  if (!current) return null
  return WIZARD_STEPS.find(s => s.order === current.order - 1) ?? null
}

// wizard_faz integer'ını step key'e çevir (eski kayıtlar için)
export function fazToStepKey(faz: number): string {
  return WIZARD_STEPS.find(s => s.order === faz)?.key ?? 'donem-acilis'
}
