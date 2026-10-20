import { motion } from 'framer-motion'

const placeholders = [
  { who: 'Élève, coaching running' },
  { who: 'Élève, coaching santé' },
  { who: 'Élève, coaching duo' },
]

export default function Testimonials() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          Ils en parlent
        </p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">
          Témoignages
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Exemples de mise en page — vrais témoignages à venir
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {placeholders.map((t) => (
          <div key={t.who} className="rounded-lg bg-brand-mint p-5">
            <p className="text-sm italic text-slate-600">
              « Emplacement témoignage : situation de départ, objectif, évolution. »
            </p>
            <p className="mt-3 text-xs font-semibold text-brand-blue">— {t.who}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
