import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react'
import { SignIn } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { GradientBg } from '~/components/layout/GradientBg'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <GradientBg className="flex items-center justify-center p-4">
      <AuthLoading>
        <div className="flex items-center justify-center">
          <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn routing="hash" />
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
  return (
    <div className="flex items-center justify-center">
      <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
