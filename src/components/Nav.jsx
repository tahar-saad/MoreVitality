import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { toISODate, isUnreadSession, FORMAT_LABELS } from '../lib/sessionHelpers'

const authLinkClass = (active) =>
  active
    ? 'whitespace-nowrap rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white'
    : 'whitespace-nowrap text-sm font-medium text-slate-600 hover:text-slate-900'

const links = [
  { to: '/coaching-sportif', label: 'Coaching Sportif' },
  { to: '/coaching-running', label: 'Coaching Running' },
  { to: '/personnalisation-textile', label: 'Personnalisation Textile' },
  { to: '/qui-suis-je', label: 'Qui suis-je ?' },
]

export default function Nav() {
  const { user, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [unreadSessions, setUnreadSessions] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const spaceHref = role === 'coach' ? '/coach' : '/espace'
  const seancesHref = role === 'coach' ? '/coach/seances' : '/espace/seances'
  const location = useLocation()
  const isLoginMode =
    location.pathname === '/connexion' &&
    new URLSearchParams(location.search).get('mode') !== 'inscription'

  // Empêche le fond de scroller pendant que le menu mobile est ouvert.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Badge "messages non lus" — recalculé à la connexion/déconnexion, et à chaque fois
  // qu'une séance est marquée comme lue n'importe où sur le site (événement "mv:session-read",
  // déclenché par markRead dans Sessions.jsx/CoachSessions.jsx/CoachStudentDetail.jsx) —
  // sans ça, le badge resterait affiché jusqu'au prochain rechargement complet de la page.
  useEffect(() => {
    if (!user) {
      setUnreadSessions([])
      return
    }
    let cancelled = false
    const SELECT =
      'id, date, label, format, session_participants(student_id, profiles(full_name)), session_comments(author_id, created_at)'

    async function loadUnread() {
      const from = toISODate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      const to = toISODate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000))

      let sessions = []
      if (role === 'coach') {
        const { data } = await supabase.from('sessions').select(SELECT).gte('date', from).lte('date', to)
        sessions = data ?? []
      } else {
        const { data: participantRows } = await supabase
          .from('session_participants')
          .select('session_id')
          .eq('student_id', user.id)
        const ids = (participantRows ?? []).map((r) => r.session_id)
        if (ids.length > 0) {
          const { data } = await supabase
            .from('sessions')
            .select(SELECT)
            .in('id', ids)
            .gte('date', from)
            .lte('date', to)
          sessions = data ?? []
        }
      }

      const { data: reads } = await supabase
        .from('session_reads')
        .select('session_id, last_read_at')
        .eq('user_id', user.id)
      if (cancelled) return

      const readMap = new Map((reads ?? []).map((r) => [r.session_id, r.last_read_at]))
      setUnreadSessions(
        sessions
          .filter((s) => isUnreadSession(s, readMap, user.id))
          .sort((a, b) => a.date.localeCompare(b.date))
      )
    }

    loadUnread()
    window.addEventListener('mv:session-read', loadUnread)
    return () => {
      cancelled = true
      window.removeEventListener('mv:session-read', loadUnread)
    }
  }, [user?.id, role])

  // Ferme le menu de notifications au clic en dehors.
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function sessionTitle(s) {
    const names = (s.session_participants || [])
      .filter((p) => p.student_id !== user?.id)
      .map((p) => p.profiles?.full_name)
      .filter(Boolean)
    return s.label || names.join(', ') || FORMAT_LABELS[s.format] || 'Séance'
  }

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        {/* shrink-0 : le logo garde toujours sa taille, jamais compressé par le reste du nav */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          aria-label="More Vitality — Accueil"
          className="shrink-0"
        >
          <img src="/icons/logo-full.svg" alt="More Vitality" className="h-10 w-auto" />
        </Link>

        <ul className="hidden gap-6 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="whitespace-nowrap text-sm text-slate-600 hover:text-slate-900"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Se connecter/Rejoindre restent visibles à tous les formats, à gauche du burger —
            seuls les liens de page se replient dans le menu mobile. */}
        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Messages"
                  aria-expanded={notifOpen}
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    />
                  </svg>
                  {unreadSessions.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                      {unreadSessions.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-10 mt-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_30px_-12px_rgba(23,56,92,0.25)]"
                    >
                      {unreadSessions.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">Aucun nouveau message.</p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {unreadSessions.map((s) => (
                            <li key={s.id}>
                              <Link
                                to={`${seancesHref}?open=${s.id}`}
                                onClick={() => setNotifOpen(false)}
                                className="block p-3 text-sm hover:bg-slate-50"
                              >
                                <span className="font-medium text-slate-800">{sessionTitle(s)}</span>
                                <span className="block text-xs text-slate-500">
                                  {new Date(s.date).toLocaleDateString('fr-BE', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link to={spaceHref} className="whitespace-nowrap text-sm font-medium">
                Mon espace
              </Link>
              <button onClick={signOut} className="whitespace-nowrap text-sm text-slate-500">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className={authLinkClass(isLoginMode)}>
                Se connecter
              </Link>
              <Link to="/connexion?mode=inscription" className={authLinkClass(!isLoginMode)}>
                Rejoindre
              </Link>
            </>
          )}

          {/* Bouton burger — zone tactile 44px, visible uniquement sur mobile, ne replie que les liens de page */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            className="flex h-11 w-11 shrink-0 items-center justify-center md:hidden"
          >
            <span className="relative block h-4 w-6">
              <span
                className={`absolute left-0 top-0 h-0.5 w-6 bg-slate-800 transition-transform duration-200 ${open ? 'translate-y-[7px] rotate-45' : ''}`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-6 bg-slate-800 transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
              />
              <span
                className={`absolute left-0 top-3.5 h-0.5 w-6 bg-slate-800 transition-transform duration-200 ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Panneau mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-lg md:hidden"
          >
            <ul className="flex flex-col divide-y divide-slate-100 px-5 pb-4">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-base font-medium text-slate-800"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
