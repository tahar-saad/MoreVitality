import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import LocationCard from '../components/LocationCard'

export default function CoachingIndividuel() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/coaching-sportif" className="text-sm font-medium text-brand-blue">
          ← Coaching Sportif
        </Link>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">
          Coaching individuel
        </h1>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg text-slate-900">Pour qui ?</h2>
          <p className="mt-3 text-sm text-slate-600">
            Pour celles et ceux qui souhaitent un accompagnement entièrement personnalisé, avec
            des séances adaptées à leurs objectifs et à leur niveau.
          </p>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-mint p-5">
          <h2 className="font-display text-lg text-slate-900">Comment ?</h2>
          <p className="mt-3 text-sm text-slate-700">
            Chaque séance est construite en fonction de vos besoins et évolue avec votre
            progression.
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-slate-900">Les séances</h2>
        <p className="mt-3 text-slate-700">
          Renforcement, cardio, mobilité, travail fonctionnel… Le contenu varie selon vos
          objectifs et vos besoins.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-brand-border bg-brand-mint p-5">
        <h2 className="font-display text-lg text-slate-900">Où ?</h2>
        <LocationCard centers={['b2m', 'aspis']} />
      </section>

      <div className="mt-10">
        <Link
          to="/contact"
          className="inline-block rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white active:scale-95 transition-transform"
        >
          Commencer l'accompagnement
        </Link>
      </div>
    </div>
  )
}
