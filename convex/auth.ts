import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'
import { ConvexError } from 'convex/values'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
    Google,
    Password({
      validatePasswordRequirements: (password: string) => {
        if (password.length < 8) {
          throw new ConvexError('Password must be at least 8 characters')
        }
        if (!/[a-z]/.test(password)) {
          throw new ConvexError('Password must contain a lowercase letter')
        }
        if (!/[A-Z]/.test(password)) {
          throw new ConvexError('Password must contain an uppercase letter')
        }
        if (!/\d/.test(password)) {
          throw new ConvexError('Password must contain a number')
        }
      },
    }),
  ],
})
