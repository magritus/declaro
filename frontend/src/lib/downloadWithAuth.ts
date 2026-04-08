const TOKEN_KEY = 'declaro-auth-token'

/**
 * Token'lı GET isteği yapıp cevabı dosya olarak indirir.
 * window.open() yerine kullanılır — browser yeni sekme açmaz, auth header gönderir.
 */
export async function downloadWithAuth(url: string, fallbackFilename = 'download.xlsx'): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    window.location.href = '/login'
    return
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    window.location.href = '/login'
    return
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`İndirme hatası (${response.status}): ${text || response.statusText}`)
  }

  const blob = await response.blob()

  // Content-Disposition'dan dosya adını al, yoksa fallback kullan
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^";\n]+)"?/)
  const filename = match?.[1]?.trim() || fallbackFilename

  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}
