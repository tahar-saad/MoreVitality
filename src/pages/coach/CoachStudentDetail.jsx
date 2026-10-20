import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import SessionCard from '../../components/coach/SessionCard'
import { FORMAT_LABELS, FORMAT_CAPS, toISODate, SESSION_SELECT, isUnreadSession } from '../../lib/sessionHelpers'

const PACKAGE_MODE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'coaching_running', label: 'Coaching Running' },
  { value: 'coaching_sante', label: 'Coaching Sportif' },
]
const PACKAGE_FORMAT_OPTIONS = [
  { value: '', label: '—' },
  { value: 'solo', label: 'Solo' },
  { value: 'duo', label: 'Duo' },
  { value: 'groupe', label: 'Groupe' },
]

const TYPE_ACCOMPAGNEMENT_LABELS = {
  coaching_sportif: 'Coaching sportif',
  coaching_running: 'Coaching running',
  indecis: "Je ne sais pas encore / j'aimerais être conseillé(e)",
}

const PAST_WINDOW_MONTHS = 3

function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return toISODate(d)
}

export default function CoachStudentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [profile, setProfile] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingPackage, setSavingPackage] = useState(false)
  const [packageMode, setPackageMode] = useState('')
  const [packageFormat, setPackageFormat] = useState('')

  const [mySessions, setMySessions] = useState([])
  const [pastSessions, setPastSessions] = useState([])
  const [pastMonthsBack, setPastMonthsBack] = useState(PAST_WINDOW_MONTHS)
  const [loadingMorePast, setLoadingMorePast] = useState(false)
  const [availableSessions, setAvailableSessions] = useState([])
  const [addingId, setAddingId] = useState(null)
  const [sessionsTab, setSessionsTab] = useState('avenir')

  const [commentDrafts, setCommentDrafts] = useState({})
  const [expandedIds, setExpandedIds] = useState({})
  const [readMap, setReadMap] = useState(new Map())

  async function loadAll(monthsBack = pastMonthsBack) {
    const today = toISODate(new Date())
    const in60Days = toISODate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000))

    const [
      { data: studentData, error: studentError },
      { data: profileData, error: profileError },
      { data: studentsData, error: studentsError },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('id', id).single(),
      supabase.from('student_profile').select('*').eq('student_id', id).maybeSingle(),
      supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
    ])
    if (studentError) console.error('CoachStudentDetail load student error:', studentError)
    if (profileError) console.error('CoachStudentDetail load profile error:', profileError)
    if (studentsError) console.error('CoachStudentDetail load students error:', studentsError)
    setStudent(studentData ?? null)
    setProfile(profileData ?? null)
    setStudents(studentsData ?? [])
    setPackageMode(profileData?.package_mode || '')
    setPackageFormat(profileData?.package_format || '')

    const { data: participantRows, error: participantError } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('student_id', id)
    if (participantError) console.error('CoachStudentDetail load participant rows error:', participantError)
    const myIds = (participantRows ?? []).map((r) => r.session_id)

    const [
      { data: mine, error: mineError },
      { data: past, error: pastError },
      { data: available, error: availableError },
      { data: reads, error: readsError },
    ] = await Promise.all([
      myIds.length > 0
        ? supabase
            .from('sessions')
            .select(SESSION_SELECT)
            .in('id', myIds)
            .gte('date', today)
            .lte('date', in60Days)
            .order('date')
        : Promise.resolve({ data: [], error: null }),
      myIds.length > 0
        ? supabase
            .from('sessions')
            .select(SESSION_SELECT)
            .in('id', myIds)
            .gte('date', monthsAgo(monthsBack))
            .lt('date', today)
            .order('date', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase.from('sessions').select(SESSION_SELECT).gte('date', today).lte('date', in60Days).order('date'),
      supabase.from('session_reads').select('session_id, last_read_at').eq('user_id', user.id),
    ])
    if (mineError) console.error('CoachStudentDetail load my sessions error:', mineError)
    if (pastError) console.error('CoachStudentDetail load past sessions error:', pastError)
    if (availableError) console.error('CoachStudentDetail load available sessions error:', availableError)
    if (readsError) console.error('CoachStudentDetail load reads error:', readsError)

    setMySessions(mine ?? [])
    setPastSessions(past ?? [])
    setAvailableSessions((available ?? []).filter((s) => !myIds.includes(s.id)))
    setReadMap(new Map((reads ?? []).map((r) => [r.session_id, r.last_read_at])))
    setLoading(false)
  }

  useEffect(() => {
    loadAll(PAST_WINDOW_MONTHS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadMorePast() {
    setLoadingMorePast(true)
    const newMonthsBack = pastMonthsBack + PAST_WINDOW_MONTHS
    setPastMonthsBack(newMonthsBack)
    await loadAll(newMonthsBack)
    setLoadingMorePast(false)
  }

  async function savePackage() {
    setSavingPackage(true)
    // upsert plutôt qu'update : un élève qui n'a pas encore rempli son questionnaire n'a
    // aucune ligne student_profile — un update silencieux ne ferait alors rien.
    await supabase.from('student_profile').upsert({
      student_id: id,
      package_mode: packageMode || null,
      package_format: packageFormat || null,
      vu_par_coach: true,
    })
    setSavingPackage(false)
    loadAll()
  }

  async function addToSession(sessionId) {
    setAddingId(sessionId)
    await supabase.from('session_participants').insert({ session_id: sessionId, student_id: id })
    if (profile && !profile.vu_par_coach) {
      await supabase.from('student_profile').update({ vu_par_coach: true }).eq('student_id', id)
    }
    await loadAll()
    setAddingId(null)
  }

  function toggleExpanded(sessionId) {
    const opening = !expandedIds[sessionId]
    setExpandedIds((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }))
    if (opening) markRead(sessionId)
  }

  async function markRead(sessionId) {
    const now = new Date().toISOString()
    setReadMap((prev) => new Map(prev).set(sessionId, now))
    await supabase
      .from('session_reads')
      .upsert({ session_id: sessionId, user_id: user.id, last_read_at: now }, { onConflict: 'session_id,user_id' })
    window.dispatchEvent(new Event('mv:session-read'))
  }

  async function updateStatus(sessionId, status) {
    await supabase.from('sessions').update({ status }).eq('id', sessionId)
    loadAll()
  }

  async function updateSessionFields(session, fields, scope) {
    if (scope === 'series' && session.recurrence_group_id) {
      const { date: newDate, ...rest } = fields
      const dateChanged = newDate && newDate !== session.date

      if (dateChanged) {
        const deltaDays = Math.round(
          (new Date(`${newDate}T00:00:00`) - new Date(`${session.date}T00:00:00`)) / 86400000
        )
        const { data: groupSessions, error: groupError } = await supabase
          .from('sessions')
          .select('id, date')
          .eq('recurrence_group_id', session.recurrence_group_id)
        if (groupError) console.error('CoachStudentDetail load series error:', groupError)

        await Promise.all(
          (groupSessions ?? []).map((gs) => {
            const shifted = new Date(`${gs.date}T00:00:00`)
            shifted.setDate(shifted.getDate() + deltaDays)
            return supabase
              .from('sessions')
              .update({ ...rest, date: toISODate(shifted) })
              .eq('id', gs.id)
          })
        )
      } else {
        const { error } = await supabase
          .from('sessions')
          .update(rest)
          .eq('recurrence_group_id', session.recurrence_group_id)
        if (error) console.error('CoachStudentDetail update series error:', error)
      }
    } else {
      const { error } = await supabase.from('sessions').update(fields).eq('id', session.id)
      if (error) console.error('CoachStudentDetail update error:', error)
    }
    loadAll()
  }

  async function deleteSeries(session) {
    if (!session.recurrence_group_id) return
    const confirmed = window.confirm(
      "Supprimer toutes les séances à venir de cette série ? Les séances déjà passées restent conservées."
    )
    if (!confirmed) return
    const today = toISODate(new Date())
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('recurrence_group_id', session.recurrence_group_id)
      .gte('date', today)
    if (error) console.error('CoachStudentDetail delete series error:', error)
    loadAll()
  }

  async function addParticipant(sessionId, studentId) {
    await supabase.from('session_participants').insert({ session_id: sessionId, student_id: studentId })
    loadAll()
  }

  async function removeParticipant(sessionId, studentId) {
    await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
    loadAll()
  }

  async function submitComment(sessionId) {
    const body = (commentDrafts[sessionId] || '').trim()
    if (!body) return
    await supabase.from('session_comments').insert({ session_id: sessionId, author_id: user.id, body })
    setCommentDrafts((prev) => ({ ...prev, [sessionId]: '' }))
    loadAll()
  }

  function sessionCardProps(s) {
    return {
      s,
      expanded: !!expandedIds[s.id],
      onToggle: () => toggleExpanded(s.id),
      unread: isUnreadSession(s, readMap, user.id),
      hasComments: (s.session_comments || []).length > 0,
      students,
      onAddParticipant: addParticipant,
      onRemoveParticipant: removeParticipant,
      onUpdateStatus: updateStatus,
      onUpdateFields: updateSessionFields,
      onDeleteSeries: deleteSeries,
      onSubmitComment: () => submitComment(s.id),
      commentDraft: commentDrafts[s.id],
      onCommentChange: (v) => setCommentDrafts((prev) => ({ ...prev, [s.id]: v })),
    }
  }

  const addableSessions = useMemo(
    () =>
      availableSessions.filter((s) => {
        const cap = FORMAT_CAPS[s.format] ?? Infinity
        return s.session_participants.length < cap
      }),
    [availableSessions]
  )

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-sm text-slate-500">Chargement…</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">Espace coach</p>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-3xl text-slate-900 md:text-4xl">
          {student?.full_name || student?.email || 'Sans nom'}
        </h1>
        <Link to="/coach" className="text-sm font-medium text-slate-500">
          ← Mes élèves
        </Link>
      </div>

      {!profile?.rempli_le ? (
        <p className="mt-8 text-sm text-slate-500">Cet élève n'a pas encore rempli son questionnaire de profil.</p>
      ) : (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg text-slate-900">Questionnaire de profil</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="shrink-0 text-slate-500">Accompagnement recherché</dt>
              <dd className="text-right font-medium text-slate-800">
                {TYPE_ACCOMPAGNEMENT_LABELS[profile.type_accompagnement] || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Niveau</dt>
              <dd className="text-right font-medium text-slate-800">{profile.niveau || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="shrink-0 text-slate-500">Objectif</dt>
              <dd className="text-right font-medium text-slate-800">{profile.objectif || '—'}</dd>
            </div>
            {profile.course_distance && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="shrink-0 text-slate-500">Course</dt>
                <dd className="text-right font-medium text-slate-800">
                  {profile.course_distance}
                  {profile.course_nom ? ` · ${profile.course_nom}` : ''}
                  {profile.course_date ? ` · ${profile.course_date}` : ''}
                  {' · '}
                  {profile.course_deja_participe ? 'déjà couru une course' : 'première course'}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Format préféré</dt>
              <dd className="text-right font-medium text-slate-800">
                {{ individuel: 'Solo', duo: 'Duo', groupe: 'Groupe', peu_importe: 'Peu importe' }[
                  profile.format_prefere
                ] || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="shrink-0 text-slate-500">Disponibilités</dt>
              <dd className="text-right font-medium text-slate-800">{profile.contraintes_temps || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 pb-2">
              <dt className="shrink-0 text-slate-500">Blessures</dt>
              <dd className="text-right font-medium text-slate-800">{profile.blessures || 'Non'}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-brand-border bg-brand-mint p-5">
        <h2 className="font-display text-lg text-slate-900">Package assigné</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            value={packageMode}
            onChange={(e) => setPackageMode(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
          >
            {PACKAGE_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={packageFormat}
            onChange={(e) => setPackageFormat(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
          >
            {PACKAGE_FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={savePackage}
            disabled={savingPackage}
            className="rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {savingPackage ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-lg text-slate-900">Séances</h2>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setSessionsTab('avenir')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              sessionsTab === 'avenir' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setSessionsTab('passees')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              sessionsTab === 'passees' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Passées
          </button>
        </div>

        {sessionsTab === 'avenir' && (
          <div className="mt-4">
            {mySessions.length === 0 && <p className="text-sm text-slate-500">Aucune séance à venir.</p>}
            <div className="space-y-2">
              {mySessions.map((s) => (
                <SessionCard key={s.id} {...sessionCardProps(s)} />
              ))}
            </div>
          </div>
        )}

        {sessionsTab === 'passees' && (
          <div className="mt-4">
            {pastSessions.length === 0 && <p className="text-sm text-slate-500">Aucune séance passée.</p>}
            <div className="space-y-2">
              {pastSessions.map((s) => (
                <SessionCard key={s.id} {...sessionCardProps(s)} />
              ))}
            </div>
            {pastSessions.length > 0 && (
              <button
                onClick={loadMorePast}
                disabled={loadingMorePast}
                className="mt-3 w-full rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-500 disabled:opacity-40"
              >
                {loadingMorePast ? 'Chargement…' : 'Voir plus loin dans le temps'}
              </button>
            )}
          </div>
        )}

        <h3 className="mt-8 text-sm font-medium text-slate-600">Ajouter à une séance existante</h3>
        {addableSessions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Aucune séance disponible avec de la place dans les 60 jours.</p>
        ) : (
          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
            {addableSessions.map((s) => {
              const names = s.session_participants.map((p) => p.profiles?.full_name).filter(Boolean)
              return (
                <button
                  key={s.id}
                  onClick={() => addToSession(s.id)}
                  disabled={addingId === s.id}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-brand-green disabled:opacity-40"
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {s.label || FORMAT_LABELS[s.format]}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(s.date).toLocaleDateString('fr-BE', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      {s.start_time && ` · ${s.start_time.slice(0, 5)}${s.end_time ? `–${s.end_time.slice(0, 5)}` : ''}`}
                      {names.length > 0 && ` · ${names.join(', ')}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-brand-green">
                    {addingId === s.id ? '…' : '+ Ajouter'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
