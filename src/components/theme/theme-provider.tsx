import * as React from 'react'

// Dark mode is disabled - always use light theme
type Theme = 'light'

type ThemeProviderContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<
  ThemeProviderContextType | undefined
>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Always light mode
  const theme: Theme = 'light'

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
  }, [])

  // setTheme is a no-op since dark mode is disabled
  const setTheme = React.useCallback(() => {}, [])

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
