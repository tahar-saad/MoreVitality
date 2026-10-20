import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const values = [
  'Humain',
  'Bienveillance',
  'Professionnalisme',
  'Disponibilité',
  'Motivation',
  'Adaptation',
  'Progression durable',
]

const differentiators = [
  {
    title: 'Un suivi humain, pas un programme générique',
    text: 'Chaque programme est construit sur mesure, pas piqué dans un modèle tout fait.',
  },
  {
    title: 'Un accompagnement qui évolue',
    text: "Fatigue, imprévu, progression plus rapide : le programme s'ajuste avec vous.",
  },
  {
    title: 'Une vraie présence',
    text: "Un échange régulier avec moi, pas juste une appli qu'on ouvre seul.",
  },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Bloc diagonal décoratif — visible seulement à partir de tablette, pour ne pas encombrer le mobile */}
        <div
          aria-hidden
          className="absolute -right-24 top-10 hidden h-72 w-72 bg-brand-green/90 md:block"
          style={{
            borderRadius: 'var(--radius-lg)',
            clipPath: 'polygon(12% 0, 100% 6%, 90% 100%, 0 92%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 py-16 md:py-24">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold uppercase tracking-wide text-brand-green"
          >
            Coaching sportif &amp; running — Bruxelles
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-3 max-w-xl font-display text-4xl leading-tight text-slate-900 md:text-5xl"
          >
            Un accompagnement qui s'adapte à votre vie, pas l'inverse.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-md text-slate-600"
          >
            Un accompagnement sportif personnalisé qui s'adapte à votre vie pour vous
            permettre de progresser durablement.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to="/coaching-running"
              className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white active:scale-95 transition-transform"
            >
              Coaching Running
            </Link>
            <Link
              to="/coaching-sportif"
              className="rounded-full border border-brand-blue px-6 py-3 text-sm font-semibold text-brand-blue active:scale-95 transition-transform"
            >
              Coaching Sportif
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Philosophie / valeurs */}
      <section className="bg-brand-mint py-14">
        <div className="mx-auto max-w-3xl px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
            Notre approche
          </p>
          <h2 className="mt-2 font-display text-2xl text-slate-900">
            Un programme qui évolue avec vous
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">
            L'objectif n'est pas de vous imposer un programme figé, mais de vous
            accompagner dans une progression durable — en tenant compte de votre
            niveau, de vos objectifs, de vos contraintes personnelles et de votre
            quotidien.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {values.map((v) => (
              <li
                key={v}
                className="rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm text-slate-700"
              >
                {v}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pourquoi More Vitality */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
            Pourquoi More Vitality
          </p>
          <h2 className="mt-2 font-display text-2xl text-slate-900">
            Ce qui change vraiment
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {differentiators.map((d) => (
              <div
                key={d.title}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(23,56,92,0.35)]"
              >
                <h3 className="font-display text-xl text-slate-900">{d.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-blue py-14 text-center text-white">
        <div className="mx-auto max-w-xl px-5">
          <h2 className="font-display text-2xl">Prêt·e à commencer ?</h2>
          <p className="mt-2 text-white/80">
            Laissez-moi quelques informations, on échange sur votre objectif.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-blue active:scale-95 transition-transform"
          >
            Prendre contact
          </Link>
        </div>
      </section>
    </div>
  )
}
