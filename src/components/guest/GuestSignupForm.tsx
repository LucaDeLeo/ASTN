import { SignIn } from '@clerk/clerk-react'

/**
 * GuestSignupForm - Inline auth form for guest visit pages.
 * Uses Clerk's managed sign-in component.
 */
export function GuestSignupForm() {
  return <SignIn routing="hash" />
}
