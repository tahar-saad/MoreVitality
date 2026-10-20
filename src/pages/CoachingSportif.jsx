import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const formats = [
  {
    to: '/coaching-individuel',
    title: 'Individuel',
    text: 'Un accompagnement entièrement personnalisé, adapté à vos objectifs et à votre niveau.',
  },
  {
    to: '/coaching-duo',
    title: 'Duo',
    text: 'Entraînez-vous à deux tout en bénéficiant d’un accompagnement personnalisé.',
  },
  {
    to: '/coaching-groupe',
    title: 'Groupe',
    text: 'Une ambiance dynamique et conviviale, avec l’encadrement d’un coach.',
  },
]

export default function CoachingSportif() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          Centre B2M &amp; Centre ASPIS — Bruxelles
        </p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">
          Coaching Sportif
        </h1>
      </motion.div>

      <div className="mt-6 space-y-4 text-slate-700">
        <p>
          Que vous souhaitiez vous remettre en forme, améliorer votre condition physique,
          gagner en force et en tonicité ou simplement retrouver une activité physique
          régulière, le coaching sportif vous permet de bénéficier d'un accompagnement adapté
          à vos objectifs et à votre niveau.
        </p>
        <p>
          Les séances peuvent être réalisées en individuel, en duo ou en groupe, selon vos
          préférences et vos besoins.
        </p>
        <p>
          Quel que soit le format choisi, l'objectif reste le même : vous proposer des
          séances variées, adaptées et progressives, dans un cadre motivant et bienveillant.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-slate-900">
          Découvrez les différents formats pour trouver celui qui vous correspond le mieux
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {formats.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="rounded-lg border border-slate-200 bg-white p-5 transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(23,56,92,0.35)]"
            >
              <h3 className="font-display text-lg text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.text}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-blue">
                En savoir plus →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
