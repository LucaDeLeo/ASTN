import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react'
import { useEffect } from 'react'
import { LoginCard } from '~/components/auth/login-card'
import { GradientBg } from '~/components/layout/GradientBg'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <GradientBg className="flex items-center justify-center p-4">
      <AuthLoading>
        <LoginCard isLoading />
      </AuthLoading>
      <Unauthenticated>
        <LoginCard />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </GradientBg>
  )
}

function AuthenticatedRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect authenticated users to home
    navigate({ to: '/' })
  }, [navigate])

  // Show loading state while redirecting
  return <LoginCard isLoading />
}
