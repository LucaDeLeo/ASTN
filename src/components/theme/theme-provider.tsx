import * as React from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<
  ThemeProviderContextType | undefined
>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'astn-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      return stored ?? defaultTheme
    } catch {
      return defaultTheme
    }
  })

  React.useEffect(() => {
    const root = document.documentElement

    // Determine effective theme
    let effectiveTheme: 'light' | 'dark'
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      effectiveTheme = theme
    }

    // Only modify classes if needed (prevents flash when inline script already applied class)
    const hasCorrectClass = root.classList.contains(effectiveTheme)
    const hasWrongClass = root.classList.contains(
      effectiveTheme === 'dark' ? 'light' : 'dark',
    )

    if (!hasCorrectClass || hasWrongClass) {
      root.classList.remove('light', 'dark')
      root.classList.add(effectiveTheme)
    }
  }, [theme])

  // Listen for system theme changes when in system mode
  React.useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Sync cookie on mount (for existing localStorage users without cookie)
  React.useEffect(() => {
    document.cookie = `${storageKey}=${theme};path=/;max-age=31536000;SameSite=Lax`
  }, [storageKey, theme])

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch {
        // localStorage not available
      }
      // Save to cookie for SSR (1 year expiry)
      document.cookie = `${storageKey}=${newTheme};path=/;max-age=31536000;SameSite=Lax`
      setThemeState(newTheme)
    },
    [storageKey],
  )

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
