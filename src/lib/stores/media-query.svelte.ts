import { browser } from '$app/environment'
import { derived, readable, type Readable } from 'svelte/store'

export function createMediaQueryStore(query: string): Readable<boolean> {
  return readable(false, (set) => {
    if (!browser) return undefined

    const media = window.matchMedia(query)
    set(media.matches)

    const listener = (event: MediaQueryListEvent) => set(event.matches)
    media.addEventListener('change', listener)

    return () => {
      media.removeEventListener('change', listener)
    }
  })
}

export function useMediaQuery(query: string): Readable<boolean> {
  return createMediaQueryStore(query)
}

export function isMobile(): Readable<boolean> {
  return derived(createMediaQueryStore('(min-width: 768px)'), (matches) => !matches)
}

export function isDesktop(): Readable<boolean> {
  return createMediaQueryStore('(min-width: 768px)')
}

export const useIsMobile = isMobile
export const useIsDesktop = isDesktop
