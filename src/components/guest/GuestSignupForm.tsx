import { useAuthActions } from '@convex-dev/auth/react'
import { Check, X } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'

const PASSWORD_RULES = [
  {
    key: 'length',
    label: 'At least 8 characters',
    test: (p: string) => p.length >= 8,
  },
  {
    key: 'lower',
    label: 'A lowercase letter',
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    key: 'upper',
    label: 'An uppercase letter',
    test: (p: string) => /[A-Z]/.test(p),
  },
  { key: 'number', label: 'A number', test: (p: string) => /\d/.test(p) },
]

function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul aria-label="Password requirements" className="mt-1.5 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const passes = rule.test(password)
        return (
          <li key={rule.key} className="flex items-center gap-1.5 text-xs">
            {passes ? (
              <Check className="size-4 text-green-600" aria-hidden="true" />
            ) : (
              <X className="size-4 text-muted-foreground" aria-hidden="true" />
            )}
            <span
              className={passes ? 'text-green-700' : 'text-muted-foreground'}
            >
              {rule.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

interface AuthFormProps {
  flow: 'signIn' | 'signUp'
}

function AuthForm({ flow }: AuthFormProps) {
  const { signIn } = useAuthActions()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [password, setPassword] = useState('')
  const id = useId()

  const errorId = `${id}-error`

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('flow', flow)

    try {
      await signIn('password', formData)
    } catch {
      // Generic error - don't reveal which field is wrong
      setError('Invalid email or password')
      // Trigger shake animation
      setShake(true)
      setTimeout(() => setShake(false), 150)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Input
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          disabled={loading}
          className="h-11"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      <div className="space-y-2">
        <Input
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete={flow === 'signIn' ? 'current-password' : 'new-password'}
          disabled={loading}
          className="h-11"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        {flow === 'signUp' &&
          (password.length > 0 ? (
            <PasswordChecklist password={password} />
          ) : (
            <p className="text-xs text-muted-foreground">
              8+ characters, mixed case, and a number
            </p>
          ))}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            'bg-[oklch(0.95_0.05_25)] text-[oklch(0.45_0.15_25)]',
            shake && 'animate-shake',
          )}
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full text-base font-medium"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {flow === 'signIn' ? 'Signing in...' : 'Creating account...'}
          </span>
        ) : flow === 'signIn' ? (
          'Sign In'
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  )
}

/**
 * GuestSignupForm - Inline auth form for guest visit pages.
 * Defaults to "Create Account" tab since most guests are new users.
 */
export function GuestSignupForm() {
  const [activeTab, setActiveTab] = useState<'signUp' | 'signIn'>('signUp')

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'signUp' | 'signIn')}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signUp">Create Account</TabsTrigger>
        <TabsTrigger value="signIn">Sign In</TabsTrigger>
      </TabsList>
      <TabsContent value="signUp" className="mt-6">
        <AuthForm flow="signUp" />
      </TabsContent>
      <TabsContent value="signIn" className="mt-6">
        <AuthForm flow="signIn" />
      </TabsContent>
    </Tabs>
  )
}
