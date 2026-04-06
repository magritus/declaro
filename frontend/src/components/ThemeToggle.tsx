import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      aria-label="Temayı değiştir"
      className={`relative p-1.5 rounded-lg transition-all duration-200 ${
        isDark
          ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
          : 'text-slate-500 hover:text-slate-700 hover:bg-surface-overlay'
      }`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
