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
