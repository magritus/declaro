export interface Mukellef {
  id: number
  unvan: string
  vkn: string
  vergi_dairesi?: string
  created_at: string
}

export interface Donem {
  id: number
  mukellef_id: number
  yil: number
  ceyrek: 'Q1-GV' | 'Q2-GV' | 'Q3-GV' | 'YILLIK'
  created_at: string
}

export interface Calisma {
  id: number
  donem_id: number
  ticari_kar_zarar?: number
  kkeg?: number
  finansman_fonu?: number
  kar_mi_zarar_mi?: string
  wizard_faz: number
  tamamlandi: boolean
  istek_listesi?: string[]
  created_at: string
}
