import { useState, useRef } from 'react'

function formatTR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value as number)) return ''
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value as number)
}

function parseTR(str: string): number | null {
  if (!str.trim()) return null
  // Türkçe format: binlik ayırıcı nokta, ondalık virgül
  const cleaned = str.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

interface NumberInputProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  onBlur?: () => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function NumberInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder = '0,00',
  disabled,
}: NumberInputProps) {
  const [focused, setFocused] = useState(false)
  const [rawText, setRawText] = useState('')
  const suppressOnChange = useRef(false)

  const handleFocus = () => {
    setFocused(true)
    // Odaklanınca ham sayıyı göster (virgülle, Türkçe ondalık)
    if (value !== null && value !== undefined && !isNaN(value as number)) {
      setRawText(String(value).replace('.', ','))
    } else {
      setRawText('')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (suppressOnChange.current) return
    const raw = e.target.value
    setRawText(raw)
    const parsed = parseTR(raw)
    onChange(parsed)
  }

  const handleBlur = () => {
    setFocused(false)
    const parsed = parseTR(rawText)
    suppressOnChange.current = true
    onChange(parsed)
    suppressOnChange.current = false
    onBlur?.()
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={focused ? rawText : formatTR(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
