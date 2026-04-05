import type { BelgeMaddesi, BelgeDurum } from '@/api/kalem'

interface BelgelerTabProps {
  items: BelgeMaddesi[]
  durum: BelgeDurum
  onChange: (no: string, field: 'durum' | 'not', value: string) => void
  onSave: () => void
  isSaving: boolean
  kayitMesaji: string | null
}

export default function BelgelerTab({
  items,
  durum,
  onChange,
  onSave,
  isSaving,
  kayitMesaji,
}: BelgelerTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-primary">Belgeler</h2>

      {items.length === 0 ? (
        <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted text-sm">
          Bu kalem için belge listesi bulunmuyor.
        </div>
      ) : (
        <div className="border border-border-default rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-overlay border-b border-border-default">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Belge No
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Başlık
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Kategori
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Durum
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                  Not
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {items.map((belge, idx) => (
                <tr
                  key={String(belge.no)}
                  className={idx % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-overlay'}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {String(belge.no)}
                  </td>
                  <td className="px-4 py-3 text-primary">
                    {belge.baslik}
                    {belge.detay && (
                      <p className="text-xs text-muted mt-0.5">{belge.detay}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        belge.kategori === 'zorunlu'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-surface-overlay text-secondary'
                      }`}
                    >
                      {belge.kategori === 'zorunlu' ? 'Zorunlu' : 'Destekleyici'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="px-2 py-1 border border-border-default rounded text-xs bg-surface-raised text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={durum[String(belge.no)]?.durum ?? ''}
                      onChange={(e) => onChange(String(belge.no), 'durum', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option value="uygun">Uygun</option>
                      <option value="eksik">Eksik</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Not ekle..."
                      className="w-full px-2 py-1 border border-border-default rounded text-xs bg-surface-raised text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      value={durum[String(belge.no)]?.not ?? ''}
                      onChange={(e) => onChange(String(belge.no), 'not', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {kayitMesaji && (
        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
          {kayitMesaji}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={isSaving || items.length === 0}
        className="w-full bg-accent text-white py-2.5 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium text-sm transition-colors"
      >
        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  )
}
