import { motion } from 'framer-motion'
import WhatsAppLink from '../components/WhatsAppLink'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          Qui suis-je ?
        </p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">
          Maxime Verbruggen
        </h1>
      </motion.div>

      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-xs text-slate-500">
        Photo à venir.
      </div>

      <div className="mt-8 space-y-4 text-slate-700">
        <p>
          Je suis Maxime, coach sportif et coach running, et j'ai créé More Vitality avec
          l'envie de rendre le sport accessible, motivant et adapté à chacun.
        </p>
        <p>
          Passionné de sport depuis de nombreuses années, j'ai choisi d'en faire mon métier.
          Je suis diplômé d'un Bachelier en coaching sportif et spécialisé en préparation
          physique et coaching running, ce qui me permet d'accompagner aussi bien les
          personnes qui souhaitent se remettre en mouvement que celles qui veulent progresser
          ou préparer un objectif précis.
        </p>
      </div>

      <section className="mt-10 rounded-lg border border-brand-border bg-brand-mint p-5">
        <h2 className="font-display text-lg text-slate-900">Ma vision du coaching</h2>
        <p className="mt-3 text-sm text-slate-700">
          Pour moi, un bon accompagnement commence par l'écoute. Votre niveau, vos objectifs,
          vos contraintes et votre quotidien sont autant d'éléments qui doivent être pris en
          compte pour construire un entraînement qui vous correspond réellement.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Mon objectif : vous aider à progresser durablement, à prendre confiance et surtout à
          trouver du plaisir dans votre pratique sportive.
        </p>
        <p className="mt-3 font-display italic text-brand-blue">
          More Vitality, c'est du coaching humain, personnalisé et sans pression.
        </p>
      </section>

      <div className="mt-10">
        <h2 className="font-display text-lg text-slate-900">Retrouvez-moi</h2>
        <p className="mt-2 text-sm text-slate-600">
          <WhatsAppLink />
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Liens Instagram / Facebook / LinkedIn à ajouter dès réception.
        </p>
      </div>
    </div>
  )
}
