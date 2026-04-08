import { useSearchParams } from 'react-router-dom'
import {
  useAdminWizardSteps,
  useAdminAnaKategoriler,
  useAdminKalemler,
  useUpdateKalemOverride,
  type WizardStepConfig,
  type AnaKategori,
  type KalemWithOverride,
} from '@/api/adminKatalog'

const TABS = [
  { key: 'wizard-steps', label: 'Wizard Adımları' },
  { key: 'ana-kategoriler', label: 'Ana Kategoriler' },
  { key: 'kalemler', label: 'Alt Kalemler' },
]

export default function AdminKatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'wizard-steps'

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Katalog Yönetimi</h1>
        <p className="text-muted mt-1 text-sm">Wizard adımları, ana kategoriler ve alt kalemleri yönetin</p>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border-default mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSearchParams({ tab: tab.key })}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-primary hover:border-border-default'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'wizard-steps' && <WizardStepsTab />}
      {activeTab === 'ana-kategoriler' && <AnaKategorilerTab />}
      {activeTab === 'kalemler' && <KalemlerTab />}
    </div>
  )
}

function WizardStepsTab() {
  const { data: steps, isLoading } = useAdminWizardSteps()

  if (isLoading) {
    return (
      <div className="bg-surface-raised border border-border-default rounded-xl p-8 text-center text-muted">
        <p className="text-sm">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted mb-4">Sıralama ve etiket düzenlemesi yakında</p>
      <div className="space-y-3">
        {(steps ?? []).map((step: WizardStepConfig) => (
          <div
            key={step.key}
            className="flex items-center gap-4 p-4 bg-surface-raised border border-border-default rounded-lg"
          >
            <span className="text-sm font-mono text-muted w-6 text-right">{step.order}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">{step.label}</p>
              <p className="text-xs text-muted font-mono">{step.key}</p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                step.aktif
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-surface-overlay text-muted border-border-default'
              }`}
            >
              {step.aktif ? 'Aktif' : 'Pasif'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const KAT_GRUP_META: Record<string, { baslik: string; renk: string }> = {
  ilave:                  { baslik: 'İlaveler (Matrah Artırıcı)', renk: 'amber' },
  zarar_olsa_dahi:        { baslik: 'Zarar Olsa Dahi İndirilecek İstisnalar', renk: 'emerald' },
  gecmis_yil_zarari:      { baslik: 'Geçmiş Yıl Zararı Mahsubu', renk: 'indigo' },
  kazanc_varsa:           { baslik: 'Kazancın Bulunması Halinde İndirilecek Kalemler', renk: 'blue' },
  hesaplanan_kv_indirimi: { baslik: 'Hesaplanan KV İndirimleri', renk: 'violet' },
}

const KAT_GRUP_ORDER = ['ilave', 'zarar_olsa_dahi', 'gecmis_yil_zarari', 'kazanc_varsa', 'hesaplanan_kv_indirimi']

function AnaKategorilerTab() {
  const { data: kategoriler, isLoading } = useAdminAnaKategoriler()

  if (isLoading) {
    return (
      <div className="bg-surface-raised border border-border-default rounded-xl p-8 text-center text-muted">
        <p className="text-sm">Yükleniyor...</p>
      </div>
    )
  }

  const grouped: Record<string, AnaKategori[]> = {}
  for (const kat of (kategoriler ?? [])) {
    const g = kat.grup || 'kazanc_varsa'
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(kat)
  }

  const toplam = (kategoriler ?? []).length
  const aktifSayisi = (kategoriler ?? []).filter(k => k.aktif).length

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">
        Toplam <strong className="text-primary">{toplam}</strong> kategori —&nbsp;
        <strong className="text-emerald-600">{aktifSayisi}</strong> aktif,&nbsp;
        <strong className="text-muted">{toplam - aktifSayisi}</strong> pasif
      </p>

      {KAT_GRUP_ORDER.map((grup) => {
        const katList = grouped[grup]
        if (!katList) return null
        const meta = KAT_GRUP_META[grup] ?? { baslik: grup, renk: 'blue' }
        const rc = RENK_CLASSES[meta.renk]
        const grupAktif = katList.filter(k => k.aktif).length

        return (
          <div key={grup} className="border border-border-default rounded-xl overflow-hidden">
            <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${rc.header}`}>
              <span className="text-sm font-bold">{meta.baslik}</span>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${rc.badge}`}>
                {grupAktif}/{katList.length} aktif
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-xs font-semibold text-muted py-2 pl-4 pr-4 w-8">Sıra</th>
                  <th className="text-left text-xs font-semibold text-muted py-2 pr-4 w-40">Kod</th>
                  <th className="text-left text-xs font-semibold text-muted py-2 pr-4">Soru</th>
                  <th className="text-left text-xs font-semibold text-muted py-2 pr-4 w-16">Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {katList.sort((a, b) => a.sira - b.sira).map((kat: AnaKategori) => (
                  <tr key={kat.id} className="hover:bg-surface-raised transition-colors">
                    <td className="py-2.5 pl-4 pr-4 text-muted font-mono text-xs">{kat.sira}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-primary">{kat.kod}</td>
                    <td className="py-2.5 pr-4 text-primary text-sm">
                      {kat.soru.length > 70 ? kat.soru.slice(0, 70) + '…' : kat.soru}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        kat.aktif
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-surface-overlay text-muted border-border-default'
                      }`}>
                        {kat.aktif ? 'Evet' : 'Hayır'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

const GRUP_META: Record<string, { baslik: string; renk: string }> = {
  ilave:                  { baslik: 'İlaveler (Matrah Artırıcı)', renk: 'amber' },
  zarar_olsa_dahi:        { baslik: 'Zarar Olsa Dahi İndirilecek İstisnalar', renk: 'emerald' },
  gecmis_yil_zarari:      { baslik: 'Geçmiş Yıl Zararı Mahsubu', renk: 'indigo' },
  kazanc_varsa:           { baslik: 'Kazancın Bulunması Halinde İndirilecek Kalemler', renk: 'blue' },
  hesaplanan_kv_indirimi: { baslik: 'Hesaplanan KV İndirimleri', renk: 'violet' },
}

const RENK_CLASSES: Record<string, { header: string; badge: string; subheader: string }> = {
  amber:   { header: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',  badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',  subheader: 'bg-amber-50/50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  emerald: { header: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300', badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300', subheader: 'bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
  indigo:  { header: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',   badge: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',   subheader: 'bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' },
  blue:    { header: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',         badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',         subheader: 'bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  violet:  { header: 'bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300',   badge: 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300',   subheader: 'bg-violet-50/50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400' },
}

function KalemlerTab() {
  const { data: kalemler, isLoading } = useAdminKalemler()
  const { data: anaKategoriler } = useAdminAnaKategoriler()
  const updateOverride = useUpdateKalemOverride()

  if (isLoading) {
    return (
      <div className="bg-surface-raised border border-border-default rounded-xl p-8 text-center text-muted">
        <p className="text-sm">Yükleniyor...</p>
      </div>
    )
  }

  const handleToggle = (kalem: KalemWithOverride) => {
    updateOverride.mutate({ ic_kod: kalem.ic_kod, aktif: !kalem.aktif })
  }

  // Ana kategori soru map (kod → soru)
  const katSoru: Record<string, string> = {}
  for (const k of (anaKategoriler ?? [])) katSoru[k.kod] = k.soru

  // Group: beyanname_bolumu → ana_kategori → kalemler[]
  const grupOrder = ['ilave', 'zarar_olsa_dahi', 'gecmis_yil_zarari', 'kazanc_varsa', 'hesaplanan_kv_indirimi']
  const grouped: Record<string, Record<string, KalemWithOverride[]>> = {}
  for (const kalem of (kalemler ?? [])) {
    const g = kalem.beyanname_bolumu || 'diger'
    const k = kalem.ana_kategori || 'diger'
    if (!grouped[g]) grouped[g] = {}
    if (!grouped[g][k]) grouped[g][k] = []
    grouped[g][k].push(kalem)
  }

  const toplam = (kalemler ?? []).length
  const aktifSayisi = (kalemler ?? []).filter(k => k.aktif).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Toplam <strong className="text-primary">{toplam}</strong> kalem —&nbsp;
          <strong className="text-emerald-600">{aktifSayisi}</strong> aktif,&nbsp;
          <strong className="text-muted">{toplam - aktifSayisi}</strong> pasif
        </p>
      </div>

      {grupOrder.map((grup) => {
        const katMap = grouped[grup]
        if (!katMap) return null
        const meta = GRUP_META[grup] ?? { baslik: grup, renk: 'blue' }
        const rc = RENK_CLASSES[meta.renk]
        const grupToplam = Object.values(katMap).flat().length
        const grupAktif = Object.values(katMap).flat().filter(k => k.aktif).length

        return (
          <div key={grup} className="border border-border-default rounded-xl overflow-hidden">
            {/* Grup başlığı */}
            <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${rc.header}`}>
              <span className="text-sm font-bold">{meta.baslik}</span>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${rc.badge}`}>
                {grupAktif}/{grupToplam} aktif
              </span>
            </div>

            {/* Ana kategori grupları */}
            {Object.entries(katMap).map(([katKod, katKalemler]) => (
              <div key={katKod}>
                {/* Alt başlık */}
                <div className={`flex items-center gap-2 px-4 py-1.5 border-b border-border-subtle ${rc.subheader}`}>
                  <span className="text-xs font-semibold">{katSoru[katKod] || katKod}</span>
                  <span className="ml-auto text-xs font-mono text-muted">{katKod}</span>
                  <span className="text-xs text-muted ml-2">{katKalemler.filter(k=>k.aktif).length}/{katKalemler.length}</span>
                </div>

                {/* Kalemler */}
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border-subtle">
                    {katKalemler.map((kalem) => (
                      <tr key={kalem.ic_kod} className="hover:bg-surface-raised transition-colors">
                        <td className="py-2 pl-8 pr-4 font-mono text-xs text-muted w-64">{kalem.ic_kod}</td>
                        <td className="py-2 pr-4 text-primary text-sm">
                          {kalem.baslik.length > 80 ? kalem.baslik.slice(0, 80) + '…' : kalem.baslik}
                        </td>
                        <td className="py-2 pr-4 w-20">
                          <button
                            onClick={() => handleToggle(kalem)}
                            disabled={updateOverride.isPending}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-40 ${
                              kalem.aktif
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-surface-overlay text-muted border-border-default'
                            }`}
                          >
                            {kalem.aktif ? 'Aktif' : 'Pasif'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
