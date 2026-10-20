import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const items = [
  'Entreprises',
  'Clubs / associations sportives',
  'Événements (mariages, EVG / EVJF, etc.)',
  'Projets ponctuels',
  'Vêtements et textiles personnalisés',
]

export default function PersonnalisationTextile() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          Personnalisation Textile
        </p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">
          Un projet textile à personnaliser ?
        </h1>
        <p className="mt-3 text-slate-600">
          Impression et flocage de t-shirts, polos, sweats, casquettes... avec votre logo, texte ou
          visuel. Un service indépendant du coaching, pour tout projet textile sur mesure.
        </p>
      </motion.div>

      <section className="mt-10 rounded-lg border border-brand-border bg-brand-mint p-5">
        <h2 className="font-display text-lg text-slate-900">Comment ça marche ?</h2>
        <p className="mt-3 text-sm text-slate-700">
          Vous nous transmettez votre logo ou texte, le support souhaité et la quantité — on vous
          propose la technique la plus adaptée (impression ou flocage) et on valide le rendu avec
          vous avant production.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-slate-900">Pour qui ?</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-slate-700">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-xs font-bold text-brand-green">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-xs text-slate-500">
        Photos de réalisations à venir.
      </div>

      <div className="mt-10">
        <Link
          to="/contact"
          className="inline-block rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white active:scale-95 transition-transform"
        >
          Vous avez un projet ? Parlons-en
        </Link>
      </div>
    </div>
  )
}
