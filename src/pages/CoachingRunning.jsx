import { motion } from 'framer-motion'

export default function CoachingRunning() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          100% en ligne
        </p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">
          Coaching Running
        </h1>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg text-slate-900">Pour qui ?</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Débutants</li>
            <li>Reprise de course</li>
            <li>Coureurs réguliers</li>
            <li>Préparation d'objectifs (5 km, 10 km, semi, marathon…)</li>
          </ul>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-mint p-5">
          <h2 className="font-display text-lg text-slate-900">Format</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Coaching 100 % en ligne</li>
            <li>Plateforme de suivi</li>
            <li>Communication régulière avec moi</li>
          </ul>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-slate-900">Ce qui est inclus</h2>
        <ul className="mt-4 space-y-3">
          {[
            'Bilan initial personnalisé',
            "Programme d'entraînement individualisé",
            'Suivi régulier et analyse des séances (allures, fréquence cardiaque)',
            'Adaptation permanente du programme',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-slate-700">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-xs font-bold text-brand-green">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-slate-900">Fonctionnement</h2>
        <ol className="mt-4 space-y-3">
          {[
            'Premier échange et définition des objectifs',
            'Création du programme personnalisé',
            'Réalisation des séances via la plateforme Nöliö',
            'Analyse des séances importantes',
            'Ajustements et suivi continu',
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <blockquote className="mt-10 rounded-lg border-l-4 border-brand-blue bg-brand-mint px-5 py-4 font-display italic text-brand-blue">
        Idée clé : le programme évolue avec la personne.
      </blockquote>

      <section className="mt-10">
        <h2 className="font-display text-xl text-slate-900">Comment se déroule le suivi ?</h2>
        <p className="mt-3 text-slate-700">
          Un premier visio de 30 minutes permet de faire le point et de vous présenter mon
          approche ainsi que la plateforme et son fonctionnement.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-slate-900">La personnalisation</h2>
        <p className="mt-3 text-slate-700">
          Le programme est adapté à votre niveau, à vos objectifs, à vos disponibilités et à
          votre progression. Le plan s'adapte à vos contraintes et horaires — pas l'inverse.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-brand-border bg-brand-mint p-5">
        <h2 className="font-display text-lg text-slate-900">La plateforme utilisée</h2>
        <p className="mt-3 text-sm text-slate-700">Nöliö</p>
      </section>
    </div>
  )
}
