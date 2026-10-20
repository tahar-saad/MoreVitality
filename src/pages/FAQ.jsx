import { motion } from 'framer-motion'

const faqs = [
  {
    q: 'Est-ce adapté aux débutants ?',
    a: "Oui, absolument. Aucun niveau sportif particulier n'est nécessaire pour commencer.",
  },
  {
    q: 'Dois-je déjà avoir un bon niveau sportif ?',
    a: 'Non, le programme est construit en fonction de vos capacités actuelles.',
  },
  {
    q: 'Comment fonctionne le coaching running en ligne ?',
    a: 'Un échange initial, puis un programme personnalisé suivi via la plateforme.',
  },
  {
    q: 'Combien de séances par semaine ?',
    a: 'Cela dépend de votre niveau, votre objectif et le temps disponible.',
  },
  {
    q: 'Où ont lieu les séances en présentiel ?',
    a: 'À Bruxelles : Centre B2M (Rue du Belvédère 27, 1050 Ixelles) et Centre ASPIS (Avenue Jacques Brel 34, 1200 Woluwe-Saint-Lambert).',
  },
]

export default function FAQ() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          Questions fréquentes
        </p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">FAQ</h1>
      </motion.div>

      <div className="mt-8 space-y-3">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group rounded-lg border border-slate-200 bg-white px-5 open:border-brand-blue/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-slate-800">
              {item.q}
              <span className="shrink-0 text-brand-blue transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-4 text-sm text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
