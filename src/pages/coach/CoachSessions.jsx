import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import StudentPicker from '../../components/StudentPicker'
import SessionCard from '../../components/coach/SessionCard'
import {
  FORMAT_LABELS,
  FORMAT_CAPS,
  PRESET_COLORS,
  toISODate,
  effectiveStatus,
  SESSION_SELECT,
  isUnreadSession,
} from '../../lib/sessionHelpers'

const FREQUENCY_LABELS = { semaine: 'Chaque semaine', deux_semaines: 'Toutes les 2 semaines', mois: 'Chaque mois' }
const MAX_OCCURRENCES = 52
const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function addInterval(d, frequency) {
  const nd = new Date(d)
  if (frequency === 'semaine') nd.setDate(nd.getDate() + 7)
  else if (frequency === 'deux_semaines') nd.setDate(nd.getDate() + 14)
  else if (frequency === 'mois') nd.setMonth(nd.getMonth() + 1)
  return nd
}

function generateDates(startDateStr, frequency, endMode, occurrenceCount, endDateStr) {
  const dates = [startDateStr]
  let current = new Date(`${startDateStr}T00:00:00`)

  if (endMode === 'nombre') {
    const count = Math.min(occurrenceCount, MAX_OCCURRENCES)
    for (let i = 1; i < count; i++) {
      current = addInterval(current, frequency)
      dates.push(toISODate(current))
    }
  } else if (endDateStr) {
    const end = new Date(`${endDateStr}T00:00:00`)
    while (dates.length < MAX_OCCURRENCES) {
      const next = addInterval(current, frequency)
      if (next > end) break
      dates.push(toISODate(next))
      current = next
    }
  }
  return dates
}

function getMonday(d) {
  const nd = new Date(d)
  nd.setHours(0, 0, 0, 0)
  const day = nd.getDay()
  const diff = day === 0 ? -6 : 1 - day
  nd.setDate(nd.getDate() + diff)
  return nd
}

export default function CoachSessions() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const openId = searchParams.get('open')
  const [students, setStudents] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [format, setFormat] = useState('solo')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [creating, setCreating] = useState(false)

  const [repeat, setRepeat] = useState(false)
  const [frequency, setFrequency] = useState('semaine')
  const [endMode, setEndMode] = useState('nombre')
  const [occurrenceCount, setOccurrenceCount] = useState(8)
  const [endDate, setEndDate] = useState('')

  const [commentDrafts, setCommentDrafts] = useState({})
  const [expandedIds, setExpandedIds] = useState({})
  const [readMap, setReadMap] = useState(new Map())

  const [view, setView] = useState('semaine')
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [tableMonth, setTableMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const [filterStudent, setFilterStudent] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLabel, setFilterLabel] = useState('')

  function currentRange() {
    if (view === 'semaine') {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      return [toISODate(weekStart), toISODate(end)]
    }
    const start = new Date(tableMonth.getFullYear(), tableMonth.getMonth(), 1)
    const end = new Date(tableMonth.getFullYear(), tableMonth.getMonth() + 1, 0)
    return [toISODate(start), toISODate(end)]
  }

  async function reload() {
    const [from, to] = currentRange()
    const [{ data, error }, { data: reads }] = await Promise.all([
      supabase
        .from('sessions')
        .select(SESSION_SELECT)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true }),
      supabase.from('session_reads').select('session_id, last_read_at').eq('user_id', user.id),
    ])
    if (error) console.error('CoachSessions load sessions error:', error)
    setSessions(data ?? [])
    setReadMap(new Map((reads ?? []).map((r) => [r.session_id, r.last_read_at])))
    setLoading(false)
  }

  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'student')
        .order('full_name')
      if (error) console.error('CoachSessions load students error:', error)
      setStudents(data ?? [])
    }
    loadStudents()
  }, [])

  useEffect(() => {
    setLoading(true)
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, weekStart, tableMonth])

  function toggleExpanded(id) {
    const opening = !expandedIds[id]
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
    if (opening) markRead(id)
  }

  async function markRead(sessionId) {
    const now = new Date().toISOString()
    setReadMap((prev) => new Map(prev).set(sessionId, now))
    await supabase
      .from('session_reads')
      .upsert({ session_id: sessionId, user_id: user.id, last_read_at: now }, { onConflict: 'session_id,user_id' })
    window.dispatchEvent(new Event('mv:session-read'))
  }

  // Lien direct depuis le menu de notifications : bascule sur la semaine de la séance,
  // la déplie et la marque comme lue.
  useEffect(() => {
    if (!openId) return
    let cancelled = false
    async function openTarget() {
      const { data: target } = await supabase.from('sessions').select('id, date').eq('id', openId).maybeSingle()
      if (!target || cancelled) return
      setView('semaine')
      setWeekStart(getMonday(new Date(`${target.date}T00:00:00`)))
      setExpandedIds((prev) => ({ ...prev, [openId]: true }))
      markRead(openId)
    }
    openTarget()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId])

  useEffect(() => {
    if (!openId) return
    const el = document.getElementById(`session-${openId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [openId, sessions])

  function addStudent(id) {
    setSelectedStudents((prev) => (prev.length >= FORMAT_CAPS[format] ? prev : [...prev, id]))
  }

  function removeStudent(id) {
    setSelectedStudents((prev) => prev.filter((x) => x !== id))
  }

  function handleFormatChange(f) {
    setFormat(f)
    setSelectedStudents((prev) => prev.slice(0, FORMAT_CAPS[f]))
  }

  const dates = !date ? [] : repeat ? generateDates(date, frequency, endMode, occurrenceCount, endDate) : [date]

  async function handleCreate(e) {
    e.preventDefault()
    if (!date || dates.length === 0) return
    setCreating(true)
    const recurrence_group_id = dates.length > 1 ? crypto.randomUUID() : null
    const finalLabel = label.trim() || null
    const rows = dates.map((d) => ({
      coach_id: user.id,
      date: d,
      start_time: startTime || null,
      end_time: endTime || null,
      content,
      format,
      status: 'scheduled',
      label: finalLabel,
      color,
      recurrence_group_id,
    }))
    const { data: created, error } = await supabase.from('sessions').insert(rows).select()

    if (error) console.error('CoachSessions create error:', error)

    if (!error && created) {
      if (selectedStudents.length > 0) {
        const participantRows = created.flatMap((sess) =>
          selectedStudents.map((student_id) => ({ session_id: sess.id, student_id }))
        )
        await supabase.from('session_participants').insert(participantRows)
      }
      setDate('')
      setStartTime('')
      setEndTime('')
      setContent('')
      setLabel('')
      setColor(PRESET_COLORS[0])
      setFormat('solo')
      setSelectedStudents([])
      setRepeat(false)
      setOccurrenceCount(8)
      setEndDate('')
      setFormOpen(false)
      await reload()
    }
    setCreating(false)
  }

  async function updateStatus(sessionId, status) {
    await supabase.from('sessions').update({ status }).eq('id', sessionId)
    reload()
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
        if (groupError) console.error('CoachSessions load series error:', groupError)

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
        if (error) console.error('CoachSessions update series error:', error)
      }
    } else {
      const { error } = await supabase.from('sessions').update(fields).eq('id', session.id)
      if (error) console.error('CoachSessions update error:', error)
    }
    reload()
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
    if (error) console.error('CoachSessions delete series error:', error)
    reload()
  }

  async function addParticipant(sessionId, studentId) {
    await supabase.from('session_participants').insert({ session_id: sessionId, student_id: studentId })
    reload()
  }

  async function removeParticipant(sessionId, studentId) {
    await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
    reload()
  }

  async function submitComment(sessionId) {
    const body = (commentDrafts[sessionId] || '').trim()
    if (!body) return
    await supabase.from('session_comments').insert({ session_id: sessionId, author_id: user.id, body })
    setCommentDrafts((prev) => ({ ...prev, [sessionId]: '' }))
    reload()
  }

  const sessionsByDate = useMemo(() => {
    const map = {}
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    }
    return map
  }, [sessions])

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return toISODate(d)
      }),
    [weekStart]
  )

  function shiftWeek(delta) {
    setWeekStart((prev) => {
      const nd = new Date(prev)
      nd.setDate(nd.getDate() + delta * 7)
      return nd
    })
  }

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  function shiftMonth(delta) {
    setTableMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const monthFiltered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterStudent && !s.session_participants.some((p) => p.student_id === filterStudent)) return false
      if (filterStatus !== 'all' && effectiveStatus(s) !== filterStatus) return false
      if (filterLabel.trim() && !(s.label || '').toLowerCase().includes(filterLabel.trim().toLowerCase()))
        return false
      return true
    })
  }, [sessions, filterStudent, filterStatus, filterLabel])

  const monthGroups = useMemo(() => {
    const map = {}
    for (const s of monthFiltered) {
      const monday = toISODate(getMonday(new Date(`${s.date}T00:00:00`)))
      if (!map[monday]) map[monday] = []
      map[monday].push(s)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monday, list]) => [
        monday,
        [...list].sort((a, b) =>
          a.date === b.date ? (a.start_time || '').localeCompare(b.start_time || '') : a.date.localeCompare(b.date)
        ),
      ])
  }, [monthFiltered])

  const isCustomColor = !PRESET_COLORS.includes(color)

  function sessionCardProps(s) {
    return {
      s,
      expanded: !!expandedIds[s.id],
      onToggle: () => toggleExpanded(s.id),
      unread: isUnreadSession(s, readMap, user.id),
      hasComments: (s.session_comments || []).length > 0,
      highlighted: s.id === openId,
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

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">Espace coach</p>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-3xl text-slate-900 md:text-4xl">Séances</h1>
        <Link to="/coach" className="text-sm font-medium text-slate-500">
          ← Mes élèves
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-brand-border bg-brand-mint">
        <button
          type="button"
          onClick={() => setFormOpen((o) => !o)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <h2 className="font-display text-lg text-slate-900">+ Créer une séance</h2>
          <span className="text-xl text-slate-500">{formOpen ? '−' : '+'}</span>
        </button>

        {formOpen && (
          <form onSubmit={handleCreate} className="space-y-4 px-5 pb-5">
            <div>
              <label className="block text-sm text-slate-600">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-slate-600">Heure de début</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-600">Heure de fin</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600">Nom (optionnel)</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex. Duo Sophie/Marc"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600">Couleur</label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Choisir la couleur ${c}`}
                    className="h-8 w-8 rounded-full border-2 transition-transform"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#0f172a' : 'transparent',
                      transform: color === c ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                ))}
                <label
                  className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-sm text-slate-400"
                  style={{
                    borderColor: isCustomColor ? '#0f172a' : '#cbd5e1',
                    backgroundColor: isCustomColor ? color : 'white',
                    borderStyle: isCustomColor ? 'solid' : 'dashed',
                  }}
                >
                  {!isCustomColor && '+'}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600">Contenu prévu</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder="Ex. fractionné 8x400m"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600">Format</label>
              <div className="mt-2 flex gap-2">
                {Object.keys(FORMAT_LABELS).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => handleFormatChange(f)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      format === f
                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600">
                Élève(s) — {FORMAT_CAPS[format] === Infinity ? 'pas de limite' : `${FORMAT_CAPS[format]} max`}{' '}
                (optionnel, ajoutable plus tard)
              </label>
              <div className="mt-2">
                <StudentPicker
                  students={students}
                  selectedIds={selectedStudents}
                  cap={FORMAT_CAPS[format]}
                  onAdd={addStudent}
                  onRemove={removeStudent}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-white p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
                Répéter cette séance
              </label>

              {repeat && (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Fréquence</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {Object.keys(FREQUENCY_LABELS).map((f) => (
                        <button
                          type="button"
                          key={f}
                          onClick={() => setFrequency(f)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            frequency === f
                              ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {FREQUENCY_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Se termine</p>
                    <div className="mt-1.5 inline-flex overflow-hidden rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setEndMode('nombre')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          endMode === 'nombre' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'
                        }`}
                      >
                        Nombre de séances
                      </button>
                      <button
                        type="button"
                        onClick={() => setEndMode('date')}
                        className={`border-l border-slate-200 px-3 py-1.5 text-xs font-medium transition-colors ${
                          endMode === 'date' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'
                        }`}
                      >
                        Jusqu'au
                      </button>
                    </div>
                  </div>

                  {endMode === 'nombre' ? (
                    <input
                      type="number"
                      min={2}
                      max={MAX_OCCURRENCES}
                      value={occurrenceCount}
                      onChange={(e) => setOccurrenceCount(Number(e.target.value))}
                      className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
                    />
                  ) : (
                    <input
                      type="date"
                      min={date}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
                    />
                  )}

                  {date && dates.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {dates.length} séance{dates.length > 1 ? 's' : ''} seront créées, du{' '}
                      {new Date(dates[0]).toLocaleDateString('fr-BE')} au{' '}
                      {new Date(dates[dates.length - 1]).toLocaleDateString('fr-BE')}.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={creating || !date || dates.length === 0}
              className="rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {creating ? 'Création…' : dates.length > 1 ? `Créer ${dates.length} séances` : 'Créer la séance'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 flex gap-2">
        <button
          onClick={() => setView('semaine')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            view === 'semaine' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Semaine
        </button>
        <button
          onClick={() => setView('toutes')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            view === 'toutes' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Par mois
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Chargement…</p>}

      {!loading && view === 'semaine' && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftWeek(-1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-800">
                {weekStart.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })} –{' '}
                {weekEnd.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })}
              </p>
              <button
                onClick={() => setWeekStart(getMonday(new Date()))}
                className="text-xs font-medium text-brand-blue"
              >
                Aujourd'hui
              </button>
            </div>
            <button
              onClick={() => shiftWeek(1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            >
              →
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {weekDates.map((d, i) => {
              const daySessions = [...(sessionsByDate[d] || [])].sort((a, b) =>
                (a.start_time || '').localeCompare(b.start_time || '')
              )
              return (
                <div key={d}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {DAY_LABELS[i]} {new Date(`${d}T00:00:00`).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })}
                  </p>
                  {daySessions.length === 0 ? (
                    <p className="mt-1.5 text-sm text-slate-300">—</p>
                  ) : (
                    <div className="mt-1.5 space-y-2">
                      {daySessions.map((s) => (
                        <SessionCard key={s.id} {...sessionCardProps(s)} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && view === 'toutes' && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-sm font-medium capitalize text-slate-800">
                {tableMonth.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })}
              </p>
              <button
                onClick={() => setTableMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                className="text-xs font-medium text-brand-blue"
              >
                Ce mois-ci
              </button>
            </div>
            <button
              onClick={() => shiftMonth(1)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            >
              →
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Élève</label>
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
              >
                <option value="">Tous les élèves</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.full_name || 'Sans nom'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Nom</label>
              <input
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                placeholder="Ex. Duo Sophie/Marc"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Statut</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {[
                  ['all', 'Tous'],
                  ['scheduled', 'À venir'],
                  ['done', 'Faite'],
                  ['cancelled', 'Annulée'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilterStatus(value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterStatus === value
                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-6">
            {monthGroups.length === 0 && (
              <p className="text-sm text-slate-500">Aucune séance pour ce mois (ou pour ces filtres).</p>
            )}
            {monthGroups.map(([monday, list]) => {
              const mondayDate = new Date(`${monday}T00:00:00`)
              const sundayDate = new Date(mondayDate)
              sundayDate.setDate(sundayDate.getDate() + 6)
              return (
                <div key={monday}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Semaine du {mondayDate.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })} au{' '}
                    {sundayDate.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="mt-1.5 space-y-2">
                    {list.map((s) => (
                      <SessionCard key={s.id} {...sessionCardProps(s)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
