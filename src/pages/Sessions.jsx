import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { isUnreadSession } from '../lib/sessionHelpers'

const STATUS_LABELS = {
  scheduled: 'À venir',
  done: 'Faite',
  cancelled: 'Annulée',
}

const FORMAT_LABELS = { solo: 'Solo', duo: 'Duo', groupe: 'Groupe' }
const PAST_WINDOW_MONTHS = 3

const SESSION_SELECT =
  'id, date, start_time, end_time, content, status, format, label, color, session_participants(student_id, profiles(full_name)), session_comments(id, body, author_id, created_at, profiles(full_name))'

function isPast(s) {
  const t = s.end_time || s.start_time || '23:59:59'
  return new Date(`${s.date}T${t}`) < new Date()
}

function effectiveStatus(s) {
  if (s.status === 'cancelled') return 'cancelled'
  if (s.status === 'done') return 'done'
  return isPast(s) ? 'done' : 'scheduled'
}

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return toISODate(d)
}

export default function Sessions() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const openId = searchParams.get('open')
  const [upcoming, setUpcoming] = useState([])
  const [past, setPast] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pastMonthsBack, setPastMonthsBack] = useState(PAST_WINDOW_MONTHS)
  const [tab, setTab] = useState('avenir')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [expandedIds, setExpandedIds] = useState({})
  const [readMap, setReadMap] = useState(new Map())

  async function fetchSessionIds() {
    const { data, error } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('student_id', user.id)
    if (error) console.error('Sessions load participant rows error:', error)
    return (data ?? []).map((r) => r.session_id)
  }

  async function fetchSessions(ids, { from, to } = {}) {
    if (ids.length === 0) return []
    let query = supabase.from('sessions').select(SESSION_SELECT).in('id', ids).order('date', { ascending: true })
    if (from) query = query.gte('date', from)
    if (to) query = query.lt('date', to)
    const { data, error } = await query
    if (error) console.error('Sessions load error:', error)
    return data ?? []
  }

  async function loadAll(monthsBack = pastMonthsBack) {
    const today = toISODate(new Date())
    const ids = await fetchSessionIds()
    const [up, pa, { data: reads }] = await Promise.all([
      fetchSessions(ids, { from: today }),
      fetchSessions(ids, { from: monthsAgo(monthsBack), to: today }),
      supabase.from('session_reads').select('session_id, last_read_at').eq('user_id', user.id),
    ])
    setUpcoming(up)
    setPast([...pa].reverse())
    setReadMap(new Map((reads ?? []).map((r) => [r.session_id, r.last_read_at])))
  }

  useEffect(() => {
    setLoading(true)
    loadAll(PAST_WINDOW_MONTHS).then(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  async function loadMorePast() {
    setLoadingMore(true)
    const newMonthsBack = pastMonthsBack + PAST_WINDOW_MONTHS
    setPastMonthsBack(newMonthsBack)
    await loadAll(newMonthsBack)
    setLoadingMore(false)
  }

  // Lien direct depuis le menu de notifications : bascule sur le bon onglet, élargit la
  // fenêtre "passées" si besoin, déplie la séance et la marque comme lue.
  useEffect(() => {
    if (!openId) return
    let cancelled = false
    async function openTarget() {
      const { data: target } = await supabase.from('sessions').select('id, date').eq('id', openId).maybeSingle()
      if (!target || cancelled) return
      const today = toISODate(new Date())
      if (target.date < today) {
        setTab('passees')
        const monthsNeeded =
          Math.ceil((new Date(today) - new Date(target.date)) / (30 * 24 * 60 * 60 * 1000)) + 1
        if (monthsNeeded > pastMonthsBack) {
          setPastMonthsBack(monthsNeeded)
          await loadAll(monthsNeeded)
        }
      } else {
        setTab('avenir')
      }
      if (cancelled) return
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
  }, [openId, upcoming, past])

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

  async function submitComment(sessionId) {
    const body = (commentDrafts[sessionId] || '').trim()
    if (!body) return
    await supabase.from('session_comments').insert({ session_id: sessionId, author_id: user.id, body })
    setCommentDrafts((prev) => ({ ...prev, [sessionId]: '' }))
    loadAll()
  }

  const shown = tab === 'avenir' ? upcoming : past

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">Espace personnel</p>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-3xl text-slate-900 md:text-4xl">Mes séances</h1>
        <Link to="/espace" className="text-sm font-medium text-slate-500">
          ← Mon espace
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab('avenir')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === 'avenir' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          À venir
        </button>
        <button
          onClick={() => setTab('passees')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === 'passees' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Passées
        </button>
      </div>

      {loading && <p className="mt-8 text-sm text-slate-500">Chargement…</p>}

      {!loading && shown.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">
          {tab === 'avenir' ? "Pas de séance prévue pour l'instant." : 'Aucune séance passée pour l’instant.'}
        </p>
      )}

      <div className="mt-6 space-y-2">
        {shown.map((s) => {
          const others = s.session_participants
            .filter((p) => p.student_id !== user.id)
            .map((p) => p.profiles?.full_name)
            .filter(Boolean)
          const title = s.label || (others.length > 0 ? `Avec ${others.join(', ')}` : FORMAT_LABELS[s.format])
          const expanded = !!expandedIds[s.id]
          const unread = isUnreadSession(s, readMap, user.id)

          return (
            <div
              key={s.id}
              id={`session-${s.id}`}
              className={`overflow-hidden rounded-lg border bg-white ${
                s.id === openId ? 'border-brand-green' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpanded(s.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.date).toLocaleDateString('fr-BE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {s.start_time &&
                      ` · ${s.start_time.slice(0, 5)}${s.end_time ? `–${s.end_time.slice(0, 5)}` : ''}`}
                  </p>
                </div>
                {(unread || s.session_comments.length > 0) && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`h-4 w-4 shrink-0 ${unread ? 'text-red-500' : 'text-brand-green'}`}
                    aria-label={unread ? 'Message non lu' : 'Messages lus'}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    />
                  </svg>
                )}
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {STATUS_LABELS[effectiveStatus(s)]}
                </span>
              </button>

              {expanded && (
                <div className="border-t border-slate-100 p-4 pt-3">
                  {s.content && <p className="text-sm text-slate-600">{s.content}</p>}

                  {others.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {others.map((name) => (
                        <span
                          key={name}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    {s.session_comments
                      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                      .map((c) => (
                        <p key={c.id} className="text-sm text-slate-600">
                          <span className="font-medium text-slate-800">{c.profiles?.full_name || 'Anonyme'}</span>{' '}
                          — {c.body}
                        </p>
                      ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={commentDrafts[s.id] || ''}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="Ajouter un commentaire"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
                      />
                      <button
                        onClick={() => submitComment(s.id)}
                        className="rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-white"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!loading && tab === 'passees' && past.length > 0 && (
        <button
          onClick={loadMorePast}
          disabled={loadingMore}
          className="mt-4 w-full rounded-full border border-slate-200 py-2.5 text-sm font-medium text-slate-500 disabled:opacity-40"
        >
          {loadingMore ? 'Chargement…' : 'Voir plus loin dans le temps'}
        </button>
      )}
    </div>
  )
}
