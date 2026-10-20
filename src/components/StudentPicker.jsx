import { useEffect, useRef, useState } from 'react'

export default function StudentPicker({ students, selectedIds, cap, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const atCap = selectedIds.length >= cap
  const selected = selectedIds.map((id) => students.find((s) => s.id === id)).filter(Boolean)

  const available = students.filter((s) => !selectedIds.includes(s.id))
  const matches = query.trim()
    ? available.filter((s) => (s.full_name || '').toLowerCase().includes(query.trim().toLowerCase()))
    : available

  function pick(id) {
    onAdd(id)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1.5 rounded-full border border-brand-green bg-brand-green/10 py-1.5 pl-3 pr-2 text-sm font-medium text-brand-green"
            >
              {s.full_name || 'Sans nom'}
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                aria-label={`Retirer ${s.full_name || 'cet élève'}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-brand-green/70 hover:bg-brand-green/20 hover:text-brand-green"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {atCap ? (
        <p className="text-xs text-slate-400">Plafond atteint pour ce format.</p>
      ) : (
        <>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            <input
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder="Rechercher ou choisir un élève…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-brand-green focus:outline-none"
            />
          </div>

          {open && (
            <div className="absolute z-10 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-[0_10px_30px_-12px_rgba(23,56,92,0.25)]">
              {matches.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">Aucun élève trouvé.</p>
              ) : (
                matches.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => pick(s.id)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-brand-green/10 hover:text-brand-green"
                  >
                    {s.full_name || 'Sans nom'}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
