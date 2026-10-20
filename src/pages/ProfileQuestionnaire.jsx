import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const TYPE_OPTIONS = [
  { value: 'coaching_sportif', label: 'Coaching sportif' },
  { value: 'coaching_running', label: 'Coaching running' },
  { value: 'indecis', label: "Je ne sais pas encore / j'aimerais être conseillé(e)" },
]

const NIVEAU_OPTIONS = ['Débutant', 'Intermédiaire', 'Avancé', 'Je reprends après une pause']

const SPORTIF_OBJECTIF_OPTIONS = [
  'Remise en forme',
  'Perte de poids',
  'Tonicité / renforcement',
  'Condition physique',
  'Reprise sportive',
  'Préparation physique',
  'Bien-être / santé',
  'Autre',
]

const RUNNING_OBJECTIF_OPTIONS = [
  'Commencer à courir',
  'Reprendre la course',
  'Courir plus régulièrement',
  'Préparer une course',
  'Améliorer mes performances',
  'Autre',
]

const COURSE_DISTANCE_OPTIONS = ['5 km', '10 km', 'Semi-marathon', 'Marathon', 'Autre']

const FORMAT_OPTIONS = [
  { label: 'Solo', value: 'individuel' },
  { label: 'Duo', value: 'duo' },
  { label: 'Groupe', value: 'groupe' },
  { label: 'Peu importe', value: 'peu_importe' },
]

const JOURS_OPTIONS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const MOMENT_OPTIONS = ['Matin', 'Midi', 'Soir']

function getSteps(typeAccompagnement, objectif) {
  const steps = ['type']
  if (typeAccompagnement === 'coaching_sportif') {
    steps.push('objectif', 'format')
  } else if (typeAccompagnement === 'coaching_running') {
    steps.push('objectif')
    if (objectif === 'Préparer une course') steps.push('course')
  }
  steps.push('niveau', 'dispo', 'sante', 'recap')
  return steps
}

function parseDispo(text) {
  const map = {}
  if (!text) return map
  text.split('·').forEach((chunk) => {
    const [jour, moments] = chunk.split(':').map((s) => s.trim())
    if (jour && moments) map[jour] = moments.split(',').map((m) => m.trim())
  })
  return map
}

function serializeDispo(dispoMap) {
  return Object.entries(dispoMap)
    .filter(([, moments]) => moments.length > 0)
    .map(([jour, moments]) => `${jour}: ${moments.join(', ')}`)
    .join(' · ')
}

function ProgressBar({ step, total }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-brand-green transition-all duration-300"
        style={{ width: `${((step + 1) / total) * 100}%` }}
      />
    </div>
  )
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
        selected
          ? 'border-brand-green bg-brand-green/10 text-brand-green'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-brand-green focus:outline-none'

export default function ProfileQuestionnaire() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const [typeAccompagnement, setTypeAccompagnement] = useState('')
  const [niveau, setNiveau] = useState('')
  const [objectif, setObjectif] = useState('')
  const [objectifAutre, setObjectifAutre] = useState('')
  const [courseDistance, setCourseDistance] = useState('')
  const [courseNom, setCourseNom] = useState('')
  const [courseDate, setCourseDate] = useState('')
  const [courseDejaParticipe, setCourseDejaParticipe] = useState(null)
  const [formatPrefere, setFormatPrefere] = useState('')
  const [dispoMap, setDispoMap] = useState({})
  const [aBlessure, setABlessure] = useState(null)
  const [blessures, setBlessures] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('student_profile')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle()

      if (data) {
        setTypeAccompagnement(data.type_accompagnement || '')
        setNiveau(data.niveau || '')
        const objectifOptions =
          data.type_accompagnement === 'coaching_running'
            ? RUNNING_OBJECTIF_OPTIONS
            : SPORTIF_OBJECTIF_OPTIONS
        if (data.objectif && !objectifOptions.includes(data.objectif)) {
          setObjectif('Autre')
          setObjectifAutre(data.objectif)
        } else {
          setObjectif(data.objectif || '')
        }
        setCourseDistance(data.course_distance || '')
        setCourseNom(data.course_nom || '')
        setCourseDate(data.course_date || '')
        setCourseDejaParticipe(
          data.course_deja_participe === null || data.course_deja_participe === undefined
            ? null
            : data.course_deja_participe
        )
        setFormatPrefere(data.format_prefere || '')
        setDispoMap(parseDispo(data.contraintes_temps))
        setABlessure(data.blessures ? true : data.rempli_le ? false : null)
        setBlessures(data.blessures || '')
      }
      setLoading(false)
    }
    load()
  }, [user.id])

  function chooseType(value) {
    setTypeAccompagnement(value)
    // Change de branche : les réponses liées à l'ancienne branche n'ont plus de sens.
    setObjectif('')
    setObjectifAutre('')
    setCourseDistance('')
    setCourseNom('')
    setCourseDate('')
    setCourseDejaParticipe(null)
    setFormatPrefere('')
  }

  function toggleSlot(jour, m) {
    setDispoMap((prev) => {
      const current = prev[jour] || []
      const next = current.includes(m) ? current.filter((x) => x !== m) : [...current, m]
      return { ...prev, [jour]: next }
    })
  }

  const steps = getSteps(typeAccompagnement, objectif)
  const isSportif = typeAccompagnement === 'coaching_sportif'
  const isRunning = typeAccompagnement === 'coaching_running'
  const objectifOptions = isRunning ? RUNNING_OBJECTIF_OPTIONS : SPORTIF_OBJECTIF_OPTIONS

  const canGoNext = () => {
    const step = steps[stepIndex]
    if (step === 'type') return !!typeAccompagnement
    if (step === 'objectif') return objectif && (objectif !== 'Autre' || objectifAutre.trim())
    if (step === 'course') return !!courseDistance && courseDejaParticipe !== null
    if (step === 'format') return !!formatPrefere
    if (step === 'niveau') return !!niveau
    if (step === 'dispo') return Object.values(dispoMap).some((moments) => moments.length > 0)
    if (step === 'sante') return aBlessure !== null && (!aBlessure || blessures.trim())
    return true
  }

  async function handleSubmit() {
    setSaving(true)
    const contraintes_temps = serializeDispo(dispoMap)
    const isCoursePrep = isRunning && objectif === 'Préparer une course'
    const payload = {
      student_id: user.id,
      type_accompagnement: typeAccompagnement,
      niveau,
      objectif:
        isSportif || isRunning ? (objectif === 'Autre' ? objectifAutre.trim() : objectif) : null,
      contraintes_temps,
      blessures: aBlessure ? blessures.trim() : null,
      format_prefere: isSportif ? formatPrefere : null,
      lieu_prefere: isSportif ? 'presentiel' : isRunning ? 'en_ligne' : null,
      course_distance: isCoursePrep ? courseDistance : null,
      course_nom: isCoursePrep ? courseNom.trim() || null : null,
      course_date: isCoursePrep ? courseDate || null : null,
      course_deja_participe: isCoursePrep ? courseDejaParticipe : null,
      rempli_le: new Date().toISOString(),
      vu_par_coach: false,
    }
    const { error } = await supabase.from('student_profile').upsert(payload)
    setSaving(false)
    if (!error) navigate('/espace')
  }

  if (loading) {
    return <div className="mx-auto max-w-md px-5 py-20 text-center text-sm text-slate-500">Chargement…</div>
  }

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const isCoursePrep = isRunning && objectif === 'Préparer une course'

  return (
    <div className="mx-auto max-w-md px-5 py-10 md:py-16">
      <ProgressBar step={stepIndex} total={steps.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="mt-8"
        >
          {step === 'type' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">
                Quel type d'accompagnement recherchez-vous ?
              </h1>
              <div className="mt-6 space-y-2">
                {TYPE_OPTIONS.map((o) => (
                  <OptionButton
                    key={o.value}
                    selected={typeAccompagnement === o.value}
                    onClick={() => chooseType(o.value)}
                  >
                    {o.label}
                  </OptionButton>
                ))}
              </div>
            </>
          )}

          {step === 'objectif' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">
                {isRunning
                  ? 'Quel est votre objectif avec le coaching running ?'
                  : 'Quel est votre objectif principal ?'}
              </h1>
              <div className="mt-6 space-y-2">
                {objectifOptions.map((o) => (
                  <OptionButton key={o} selected={objectif === o} onClick={() => setObjectif(o)}>
                    {o}
                  </OptionButton>
                ))}
                {objectif === 'Autre' && (
                  <input
                    autoFocus
                    value={objectifAutre}
                    onChange={(e) => setObjectifAutre(e.target.value)}
                    placeholder="Précisez votre objectif"
                    className={inputClass}
                  />
                )}
              </div>
            </>
          )}

          {step === 'course' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">
                Quelques détails sur votre course
              </h1>
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700">Quelle distance ?</p>
                <div className="mt-2 space-y-2">
                  {COURSE_DISTANCE_OPTIONS.map((d) => (
                    <OptionButton
                      key={d}
                      selected={courseDistance === d}
                      onClick={() => setCourseDistance(d)}
                    >
                      {d}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700">
                  Avez-vous déjà participé à une course ?
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <OptionButton
                    selected={courseDejaParticipe === true}
                    onClick={() => setCourseDejaParticipe(true)}
                  >
                    Oui
                  </OptionButton>
                  <OptionButton
                    selected={courseDejaParticipe === false}
                    onClick={() => setCourseDejaParticipe(false)}
                  >
                    Non
                  </OptionButton>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <input
                  value={courseNom}
                  onChange={(e) => setCourseNom(e.target.value)}
                  placeholder="Nom de la course (facultatif)"
                  className={inputClass}
                />
                <input
                  type="date"
                  value={courseDate}
                  onChange={(e) => setCourseDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {step === 'format' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">
                Vous préférez vous entraîner comment ?
              </h1>
              <div className="mt-6 space-y-2">
                {FORMAT_OPTIONS.map((o) => (
                  <OptionButton
                    key={o.value}
                    selected={formatPrefere === o.value}
                    onClick={() => setFormatPrefere(o.value)}
                  >
                    {o.label}
                  </OptionButton>
                ))}
              </div>
            </>
          )}

          {step === 'niveau' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">
                Où en êtes-vous dans votre pratique sportive ?
              </h1>
              <div className="mt-6 space-y-2">
                {NIVEAU_OPTIONS.map((o) => (
                  <OptionButton key={o} selected={niveau === o} onClick={() => setNiveau(o)}>
                    {o}
                  </OptionButton>
                ))}
              </div>
            </>
          )}

          {step === 'dispo' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">
                Quels jours et à quels moments êtes-vous disponible pour qu'on s'entraîne ensemble ?
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Cochez autant de cases que vous voulez — par exemple mercredi matin et samedi toute
                la journée.
              </p>
              <div className="mt-6 space-y-2">
                {JOURS_OPTIONS.map((jour) => (
                  <div
                    key={jour}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="w-20 shrink-0 text-sm font-medium text-slate-700">{jour}</span>
                    <div className="flex flex-1 gap-1.5">
                      {MOMENT_OPTIONS.map((m) => {
                        const active = (dispoMap[jour] || []).includes(m)
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => toggleSlot(jour, m)}
                            className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                              active
                                ? 'border-brand-green bg-brand-green/10 text-brand-green'
                                : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {m}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'sante' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">
                Avez-vous une blessure, une douleur ou une limitation physique dont je devrais être
                informé(e) ?
              </h1>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <OptionButton selected={aBlessure === true} onClick={() => setABlessure(true)}>
                  Oui
                </OptionButton>
                <OptionButton selected={aBlessure === false} onClick={() => { setABlessure(false); setBlessures('') }}>
                  Non
                </OptionButton>
              </div>
              {aBlessure && (
                <>
                  <textarea
                    autoFocus
                    value={blessures}
                    onChange={(e) => setBlessures(e.target.value.slice(0, 500))}
                    placeholder="Dites-m'en un peu plus"
                    rows={4}
                    maxLength={500}
                    className={`mt-4 ${inputClass}`}
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{blessures.length}/500</p>
                </>
              )}
            </>
          )}

          {step === 'recap' && (
            <>
              <h1 className="font-display text-2xl text-slate-900">On récapitule ?</h1>
              <p className="mt-2 text-sm text-slate-500">
                Vérifiez que tout est bon avant de valider — je vais m'en servir pour vous préparer
                le bon accompagnement.
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">Accompagnement</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {TYPE_OPTIONS.find((o) => o.value === typeAccompagnement)?.label}
                  </dd>
                </div>
                {(isSportif || isRunning) && (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Objectif</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {objectif === 'Autre' ? objectifAutre : objectif}
                    </dd>
                  </div>
                )}
                {isCoursePrep && (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="shrink-0 text-slate-500">Course</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {courseDistance}
                      {courseNom ? ` · ${courseNom}` : ''}
                      {courseDate ? ` · ${courseDate}` : ''}
                      {' · '}
                      {courseDejaParticipe ? 'déjà couru une course' : 'première course'}
                    </dd>
                  </div>
                )}
                {isSportif && (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Format</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {FORMAT_OPTIONS.find((o) => o.value === formatPrefere)?.label}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">Niveau</dt>
                  <dd className="text-right font-medium text-slate-800">{niveau}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="shrink-0 text-slate-500">Disponibilités</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {Object.entries(dispoMap)
                      .filter(([, moments]) => moments.length > 0)
                      .map(([jour, moments]) => `${jour} (${moments.join(', ')})`)
                      .join(', ')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 pb-2">
                  <dt className="text-slate-500">Blessures</dt>
                  <dd className="text-right font-medium text-slate-800">{aBlessure ? blessures : 'Non'}</dd>
                </div>
              </dl>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i - 1)}
            className="text-sm font-medium text-slate-500"
          >
            Précédent
          </button>
        ) : (
          <span />
        )}

        {!isLast ? (
          <button
            type="button"
            disabled={!canGoNext()}
            onClick={() => setStepIndex((i) => i + 1)}
            className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Suivant
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? 'Envoi…' : 'Valider mon profil'}
          </button>
        )}
      </div>
    </div>
  )
}
