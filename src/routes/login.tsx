import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <>
      <Unauthenticated>
        <RedirectToHome />
      </Unauthenticated>
      <Authenticated>
        <RedirectToHome />
      </Authenticated>
    </>
  )
}

function RedirectToHome() {
  const navigate = useNavigate()

  useEffect(() => {
    void navigate({ to: '/' })
  }, [navigate])

  return null
}
