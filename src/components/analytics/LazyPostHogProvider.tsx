import * as React from 'react'
import type { PostHogConfig } from 'posthog-js'

type PostHogProviderType = typeof import('@posthog/react').PostHogProvider

export function LazyPostHogProvider({
  apiKey,
  options,
  children,
}: {
  apiKey: string
  options: Partial<PostHogConfig>
  children: React.ReactNode
}) {
  const [Provider, setProvider] = React.useState<PostHogProviderType | null>(
    null,
  )

  React.useEffect(() => {
    void import('@posthog/react').then((mod) => {
      setProvider(() => mod.PostHogProvider)
    })
  }, [])

  if (!Provider) return <>{children}</>

  return (
    <Provider apiKey={apiKey} options={options}>
      {children}
    </Provider>
  )
}
