import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Spinner } from '~/components/ui/spinner'

/**
 * Redirects unauthenticated users to /login.
 * Renders a centered spinner while navigating.
 *
 * @param fullScreen - Use `min-h-screen` instead of the default
 *   `min-h-[calc(100vh-65px)]` (which accounts for a header).
 */
export function UnauthenticatedRedirect({
  fullScreen = false,
}: {
  fullScreen?: boolean
}) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/login' })
  }, [navigate])

  const heightClass = fullScreen ? 'min-h-screen' : 'min-h-[calc(100vh-65px)]'

  return (
    <div className={`flex items-center justify-center ${heightClass}`}>
      <Spinner />
    </div>
  )
}
