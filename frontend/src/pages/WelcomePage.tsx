import { useState, type FormEvent } from 'react'
import { Divider } from '../components/Divider'
import { LogoMark } from '../components/LogoMark'
import { TextField } from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api'
import '../styles/welcome.css'

type Step = 'start' | 'password' | 'signUp'

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Try again.'
}

export default function WelcomePage() {
  const { signIn, signUp } = useAuth()
  const [step, setStep] = useState<Step>('start')
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function goTo(next: Step) {
    setStep(next)
    setError(null)
    setPassword('')
    setShowPassword(false)
  }

  function startSignUp() {
    const typed = identifier.trim()
    if (typed.includes('@')) {
      setEmail(typed)
    } else if (typed) {
      setUsername(typed.toLowerCase())
    }
    goTo('signUp')
  }

  function startSignIn() {
    setIdentifier(email.trim() || username)
    goTo('start')
  }

  function continueToPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (identifier.trim()) {
      goTo('password')
    }
  }

  async function submit(action: () => Promise<void>) {
    setError(null)
    setSubmitting(true)
    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit(() => signIn(identifier.trim(), password))
  }

  function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit(() => signUp({ email: email.trim(), username, password }))
  }

  const passwordToggle = (
    <button
      type="button"
      className="text-field__action"
      aria-pressed={showPassword}
      onClick={() => setShowPassword((visible) => !visible)}
    >
      {showPassword ? 'Hide' : 'Show'}
    </button>
  )

  const backButton = (
    <button type="button" className="welcome__back" aria-label="Back" onClick={() => goTo('start')}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )

  return (
    <div className="welcome">
      <main className="welcome__panel">
        <div key={step} className="welcome__step">
          {step === 'start' && (
            <>
              <div>
                <h1 className="welcome__title">Capture a moment.</h1>
                <p className="welcome__subtitle">Join today.</p>
              </div>

              <button type="button" className="btn btn--light btn--large btn--block" onClick={startSignUp}>
                Create account
              </button>

              <Divider>or</Divider>

              <form className="welcome__form" onSubmit={continueToPassword}>
                <TextField
                  id="login-identifier"
                  label="Email or username"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
                <button type="submit" className="btn btn--light btn--large btn--block" disabled={!identifier.trim()}>
                  Continue
                </button>
              </form>

              <p className="welcome__footnote">Moments you capture are visible to everyone on moments.</p>
            </>
          )}

          {step === 'password' && (
            <>
              {backButton}
              <h1 className="welcome__step-title">Enter your password</h1>

              <form className="welcome__form" onSubmit={handleSignIn}>
                <TextField id="login-identifier-confirm" label="Email or username" value={identifier} disabled readOnly />
                <TextField
                  id="login-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  trailing={passwordToggle}
                />

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                <button type="submit" className="btn btn--light btn--large btn--block" disabled={!password || submitting}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="welcome__footnote">
                Don't have an account?{' '}
                <button type="button" className="btn btn--plain btn--inline" onClick={startSignUp}>
                  Sign up
                </button>
              </p>
            </>
          )}

          {step === 'signUp' && (
            <>
              {backButton}
              <h1 className="welcome__step-title">Create your account</h1>

              <form className="welcome__form" onSubmit={handleSignUp}>
                <TextField
                  id="signup-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  autoFocus={!email}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <TextField
                  id="signup-username"
                  label="Username"
                  leading="@"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_]{3,20}"
                  hint="3–20 characters: letters, numbers and _"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s/g, ''))}
                />
                <TextField
                  id="signup-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  trailing={passwordToggle}
                />

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn--light btn--large btn--block"
                  disabled={submitting || !email.trim() || !username || !password}
                >
                  {submitting ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="welcome__footnote">
                Moments you capture are visible to everyone on moments. Have an account already?{' '}
                <button type="button" className="btn btn--plain btn--inline" onClick={startSignIn}>
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </main>

      <LogoMark className="welcome__mark" />
    </div>
  )
}
