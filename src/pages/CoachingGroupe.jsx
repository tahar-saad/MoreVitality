import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import LocationCard from '../components/LocationCard'

export default function CoachingGroupe() {
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
          Coaching en groupe
        </h1>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg text-slate-900">Pour qui ?</h2>
          <p className="mt-3 text-sm text-slate-600">
            Pour celles et ceux qui aiment s'entraîner dans une ambiance dynamique et
            conviviale, tout en bénéficiant de l'encadrement d'un coach.
          </p>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-mint p-5">
          <h2 className="font-display text-lg text-slate-900">Comment ?</h2>
          <p className="mt-3 text-sm text-slate-700">
            Des séances en groupe à horaires fixes.
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-slate-900">Les séances</h2>
        <p className="mt-3 text-slate-700">
          Des entraînements variés combinant renforcement, cardio, mobilité et travail
          fonctionnel, avec des adaptations selon les niveaux.
        </p>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-brand-border bg-brand-mint p-5">
          <h2 className="font-display text-lg text-slate-900">Où ?</h2>
          <LocationCard centers={['aspis']} />
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg text-slate-900">Quand ?</h2>
          <p className="mt-3 text-sm text-slate-700">
            Mardi, mercredi et jeudi à 19h00.
            <br />
            Samedi à 10h30.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-display text-lg text-slate-900">Tarif</h2>
        <p className="mt-3 text-sm text-slate-700">150,00 € / 10 séances</p>
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
