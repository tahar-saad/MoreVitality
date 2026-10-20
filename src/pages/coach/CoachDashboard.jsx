import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { toISODate } from '../../lib/sessionHelpers'

const STATUS_BADGES = {
  not_filled: { label: 'Pas encore rempli', className: 'bg-slate-100 text-slate-500' },
  to_review: { label: 'Profil à examiner', className: 'bg-brand-green/15 text-brand-green' },
  no_package: { label: 'Package à définir', className: 'bg-amber-100 text-amber-700' },
  no_session: { label: 'Séance à programmer', className: 'bg-brand-blue/10 text-brand-blue' },
}

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'not_filled', label: 'Pas encore rempli' },
  { key: 'to_review', label: 'À examiner' },
  { key: 'no_package', label: 'Package à définir' },
  { key: 'no_session', label: 'Séance à programmer' },
  { key: 'done', label: 'À jour' },
]

function studentStatus(s) {
  const sp = s.student_profile
  if (!sp) return 'not_filled'
  if (!sp.vu_par_coach) return 'to_review'
  if (!sp.package_mode || !sp.package_format) return 'no_package'
  if (!s.hasUpcoming) return 'no_session'
  return null
}

export default function CoachDashboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const filteredStudents = students.filter(
    (s) => filter === 'all' || (studentStatus(s) || 'done') === filter
  )

  useEffect(() => {
    async function load() {
      const today = toISODate(new Date())
      const in60Days = toISODate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000))

      const [{ data, error }, { data: upcoming, error: upcomingError }] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, full_name, email, created_at, student_profile!student_profile_student_id_fkey(objectif, vu_par_coach, rempli_le, package_mode, package_format)'
          )
          .eq('role', 'student')
          .order('created_at', { ascending: false }),
        supabase
          .from('session_participants')
          .select('student_id, sessions!inner(date, status)')
          .gte('sessions.date', today)
          .lte('sessions.date', in60Days)
          .neq('sessions.status', 'cancelled'),
      ])

      if (error) console.error('CoachDashboard load error:', error)
      if (upcomingError) console.error('CoachDashboard load upcoming error:', upcomingError)
      setStudents(
        (data ?? []).map((s) => ({
          ...s,
          hasUpcoming: new Set((upcoming ?? []).map((r) => r.student_id)).has(s.id),
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
        Espace coach
      </p>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-3xl text-slate-900 md:text-4xl">Mes élèves</h1>
        <Link to="/coach/seances" className="text-sm font-medium text-brand-blue">
          Séances →
        </Link>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Chargement…</p>}

      {!loading && students.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          Aucun élève inscrit pour l'instant.
        </p>
      )}

      {!loading && students.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === 'all'
                ? students.length
                : students.filter((s) => (studentStatus(s) || 'done') === f.key).length
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  filter === f.key ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {!loading && students.length > 0 && filteredStudents.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">Aucun élève dans ce filtre.</p>
      )}

      <ul className="mt-8 space-y-3">
        {filteredStudents
          .map((s) => {
            const sp = s.student_profile
            const statusKey = studentStatus(s)
            const badge = statusKey && STATUS_BADGES[statusKey]
            return (
              <li key={s.id}>
                <Link
                  to={`/coach/eleves/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-brand-blue"
                >
                  <div>
                    <p className="font-medium text-slate-800">{s.full_name || s.email || 'Sans nom'}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {sp?.objectif || (sp ? 'Objectif non précisé' : 'Profil pas encore rempli')}
                    </p>
                  </div>
                  {badge && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
