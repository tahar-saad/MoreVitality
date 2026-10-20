import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const cards = [
  {
    title: 'Mon profil',
    text: 'Vos réponses au questionnaire — à revoir ou modifier à tout moment.',
    to: '/espace/profil',
  },
  { title: 'Mes séances', text: 'À venir et passées, avec mes commentaires.', to: '/espace/seances' },
  { title: 'Ma progression', text: 'À venir.' },
  { title: 'Mes partenaires', text: 'À venir — visible seulement en V1 (pas de messagerie).' },
]

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue'

export default function EspaceEleve() {
  const { user, profile } = useAuth()
  const [profileFilled, setProfileFilled] = useState(null)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('student_profile')
        .select('rempli_le')
        .eq('student_id', user.id)
        .maybeSingle()
      setProfileFilled(!!data?.rempli_le)
    }
    load()
  }, [user.id])

  useEffect(() => {
    if (!profile?.full_name) return
    const [first, ...rest] = profile.full_name.split(' ')
    setPrenom(first || '')
    setNom(rest.join(' '))
  }, [profile])

  async function handleSaveName(e) {
    e.preventDefault()
    setSavingName(true)
    const full_name = `${prenom.trim()} ${nom.trim()}`.trim()
    await supabase.from('profiles').update({ full_name }).eq('id', user.id)
    setSavingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
        Espace personnel
      </p>
      <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Mon espace</h1>
      <p className="mt-2 text-sm text-slate-500">Connecté en tant que {user?.email}</p>

      <form onSubmit={handleSaveName} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1" style={{ minWidth: 140 }}>
          <label className="block text-xs text-slate-500">Prénom</label>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className={inputClass} />
        </div>
        <div className="flex-1" style={{ minWidth: 140 }}>
          <label className="block text-xs text-slate-500">Nom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={savingName}
          className="rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {savingName ? 'Enregistrement…' : nameSaved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </form>

      {profileFilled === false && (
        <Link
          to="/espace/profil"
          className="mt-6 block rounded-lg border border-brand-green bg-brand-green/10 p-4 text-sm font-medium text-brand-green"
        >
          Complétez votre profil pour que je puisse vous proposer le bon accompagnement →
        </Link>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const className =
            'rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(23,56,92,0.35)]'
          const inner = (
            <>
              <h2 className="font-display text-lg text-slate-900">{c.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{c.text}</p>
            </>
          )
          return c.to ? (
            <Link key={c.title} to={c.to} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={c.title} className={className}>
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
