export const STATUS_LABELS = {
  scheduled: 'À venir',
  done: 'Faite',
  cancelled: 'Annulée',
}

export const FORMAT_LABELS = { solo: 'Solo', duo: 'Duo', groupe: 'Groupe' }
export const FORMAT_CAPS = { solo: 1, duo: 2, groupe: Infinity }
export const PRESET_COLORS = ['#17385c', '#279159', '#d97706', '#7c3aed', '#db2777', '#0891b2']

export function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

export function isPast(s) {
  const t = s.end_time || s.start_time || '23:59:59'
  return new Date(`${s.date}T${t}`) < new Date()
}

export function effectiveStatus(s) {
  if (s.status === 'cancelled') return 'cancelled'
  if (s.status === 'done') return 'done'
  return isPast(s) ? 'done' : 'scheduled'
}

export const SESSION_SELECT =
  'id, date, start_time, end_time, content, status, format, label, color, recurrence_group_id, session_participants(student_id, profiles(full_name)), session_comments(id, body, author_id, created_at, profiles(full_name))'

// Une séance est "non lue" pour moi s'il existe un commentaire écrit par quelqu'un
// d'autre, posté après la dernière fois où j'ai ouvert cette séance (ou jamais ouverte).
export function isUnreadSession(s, readMap, myId) {
  const lastReadAt = readMap.get(s.id)
  return (s.session_comments || []).some(
    (c) => c.author_id !== myId && (!lastReadAt || new Date(c.created_at) > new Date(lastReadAt))
  )
}
