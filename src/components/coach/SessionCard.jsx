import { useState } from 'react'
import StudentPicker from '../StudentPicker'
import { STATUS_LABELS, FORMAT_LABELS, FORMAT_CAPS, PRESET_COLORS, effectiveStatus } from '../../lib/sessionHelpers'

export default function SessionCard({
  s,
  expanded,
  onToggle,
  unread,
  hasComments,
  highlighted,
  students,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateStatus,
  onUpdateFields,
  onDeleteSeries,
  onSubmitComment,
  commentDraft,
  onCommentChange,
}) {
  const [editing, setEditing] = useState(false)
  const [editDate, setEditDate] = useState(s.date)
  const [editStartTime, setEditStartTime] = useState(s.start_time?.slice(0, 5) || '')
  const [editEndTime, setEditEndTime] = useState(s.end_time?.slice(0, 5) || '')
  const [editLabel, setEditLabel] = useState(s.label || '')
  const [editColor, setEditColor] = useState(s.color)
  const [editContent, setEditContent] = useState(s.content || '')
  const [editScope, setEditScope] = useState('one')
  const [saving, setSaving] = useState(false)

  const participantNames = s.session_participants.map((p) => p.profiles?.full_name).filter(Boolean)
  const title = s.label || (participantNames.length > 0 ? participantNames.join(', ') : FORMAT_LABELS[s.format])
  const isCustomEditColor = !PRESET_COLORS.includes(editColor)
  const participantsEditable = effectiveStatus(s) === 'scheduled'

  function startEdit() {
    setEditDate(s.date)
    setEditStartTime(s.start_time?.slice(0, 5) || '')
    setEditEndTime(s.end_time?.slice(0, 5) || '')
    setEditLabel(s.label || '')
    setEditColor(s.color)
    setEditContent(s.content || '')
    setEditScope('one')
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    await onUpdateFields(
      s,
      {
        date: editDate,
        start_time: editStartTime || null,
        end_time: editEndTime || null,
        label: editLabel.trim() || null,
        color: editColor,
        content: editContent,
      },
      editScope
    )
    setSaving(false)
    setEditing(false)
  }

  return (
    <div
      id={`session-${s.id}`}
      className={`overflow-hidden rounded-lg border bg-white ${
        highlighted ? 'border-brand-green' : 'border-slate-200'
      }`}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">
            {new Date(s.date).toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
            {s.start_time && ` · ${s.start_time.slice(0, 5)}${s.end_time ? `–${s.end_time.slice(0, 5)}` : ''}`}
          </p>
        </div>
        {(unread || hasComments) && (
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

      {expanded && editing && (
        <div className="space-y-4 border-t border-slate-100 p-4 pt-3">
          <div>
            <label className="block text-sm text-slate-600">Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-slate-600">Heure de début</label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600">Heure de fin</label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600">Nom (optionnel)</label>
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Ex. Duo Sophie/Marc"
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600">Couleur</label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setEditColor(c)}
                  aria-label={`Choisir la couleur ${c}`}
                  className="h-8 w-8 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: editColor === c ? '#0f172a' : 'transparent',
                    transform: editColor === c ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
              <label
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-sm text-slate-400"
                style={{
                  borderColor: isCustomEditColor ? '#0f172a' : '#cbd5e1',
                  backgroundColor: isCustomEditColor ? editColor : 'white',
                  borderStyle: isCustomEditColor ? 'solid' : 'dashed',
                }}
              >
                {!isCustomEditColor && '+'}
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600">Contenu prévu</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600">
              Élève(s) — {s.session_participants.length}/
              {FORMAT_CAPS[s.format] === Infinity ? '∞' : FORMAT_CAPS[s.format]}
            </label>
            <div className="mt-2">
              <StudentPicker
                students={students}
                selectedIds={s.session_participants.map((p) => p.student_id)}
                cap={FORMAT_CAPS[s.format]}
                onAdd={(studentId) => onAddParticipant(s.id, studentId)}
                onRemove={(studentId) => onRemoveParticipant(s.id, studentId)}
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Format : {FORMAT_LABELS[s.format]} (fixé à la création — supprime et recrée la séance pour en
            changer).
          </p>

          {s.recurrence_group_id && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Appliquer à</p>
              <div className="mt-1.5 inline-flex overflow-hidden rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditScope('one')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    editScope === 'one' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  Cette séance uniquement
                </button>
                <button
                  type="button"
                  onClick={() => setEditScope('series')}
                  className={`border-l border-slate-200 px-3 py-1.5 text-xs font-medium transition-colors ${
                    editScope === 'series' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  Toutes les séances de cette série
                </button>
              </div>
              {editScope === 'series' && editDate !== s.date && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Chaque séance de la série sera décalée du même nombre de jours (le jour de la semaine
                  change pour toutes, l'espacement entre elles reste identique).
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-500"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {expanded && !editing && (
        <div className="border-t border-slate-100 p-4 pt-3">
          <div className="flex items-start justify-between gap-2">
            {s.content && <p className="text-sm text-slate-600">{s.content}</p>}
            <div className="flex shrink-0 gap-3">
              <button onClick={startEdit} className="text-xs font-medium text-brand-blue">
                Modifier
              </button>
              {s.recurrence_group_id && (
                <button onClick={() => onDeleteSeries(s)} className="text-xs font-medium text-red-600">
                  Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Élève(s) — {s.session_participants.length}/
              {FORMAT_CAPS[s.format] === Infinity ? '∞' : FORMAT_CAPS[s.format]}
            </p>
            <div className="mt-2">
              {participantsEditable ? (
                <StudentPicker
                  students={students}
                  selectedIds={s.session_participants.map((p) => p.student_id)}
                  cap={FORMAT_CAPS[s.format]}
                  onAdd={(studentId) => onAddParticipant(s.id, studentId)}
                  onRemove={(studentId) => onRemoveParticipant(s.id, studentId)}
                />
              ) : participantNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {participantNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Aucun élève assigné.</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {s.status === 'cancelled' ? (
              <button
                onClick={() => onUpdateStatus(s.id, 'scheduled')}
                className="rounded-full border border-brand-green px-4 py-1.5 text-xs font-semibold text-brand-green"
              >
                Réactiver
              </button>
            ) : (
              <button
                onClick={() => onUpdateStatus(s.id, 'cancelled')}
                className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-500"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {s.session_comments
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map((c) => (
                <p key={c.id} className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{c.profiles?.full_name || 'Anonyme'}</span> —{' '}
                  {c.body}
                </p>
              ))}
            <div className="flex gap-2 pt-1">
              <input
                value={commentDraft || ''}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="Ajouter un commentaire"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-green focus:outline-none"
              />
              <button
                onClick={onSubmitComment}
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
}
