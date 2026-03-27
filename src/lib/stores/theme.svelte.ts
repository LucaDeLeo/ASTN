export class ThemeStore {
  theme = $state<'light'>('light')

  setTheme(_theme: 'light') {
    this.apply()
  }

  apply() {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
  }
}

export const themeStore = new ThemeStore()
