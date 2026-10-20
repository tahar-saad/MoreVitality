import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue'

export default function Login() {
  const [searchParams] = useSearchParams()
  const isSignup = searchParams.get('mode') === 'inscription'
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const action = isSignup ? signUpWithEmail : signInWithEmail
    const { data, error } = await action(email, password)

    if (error) {
      setError(error.message)
    } else if (data.session) {
      navigate('/espace')
    } else {
      setError(
        'Compte créé, mais aucune session ouverte — vérifiez votre boîte mail pour confirmer, ou désactivez "Confirm email" dans Supabase si vous testez en local.'
      )
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-14 md:py-20">
      <h1 className="font-display text-2xl text-slate-900">
        {isSignup ? 'Rejoindre More Vitality' : 'Se connecter'}
      </h1>

      <div className="mt-6 space-y-3">
        <button
          onClick={signInWithGoogle}
          className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 active:scale-95 transition-transform"
        >
          Continuer avec Google
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform"
        >
          {isSignup ? "S'inscrire" : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
