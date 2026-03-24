import * as React from 'react'

type PostHogProviderType = typeof import('@posthog/react').PostHogProvider

export function LazyPostHogProvider({
  apiKey,
  options,
  children,
}: {
  apiKey: string
  options: Record<string, unknown>
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
    <Provider apiKey={apiKey} options={options as never}>
      {children}
    </Provider>
  )
}
