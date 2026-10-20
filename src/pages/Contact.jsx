import { useState } from 'react'
import { motion } from 'framer-motion'
import WhatsAppLink from '../components/WhatsAppLink'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [service, setService] = useState('')
  const isTextile = service === 'Personnalisation Textile'

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: brancher sur Supabase (table "contact_requests") une fois le projet créé
    setSent(true)
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-brand-green/10 p-4 text-brand-green"
        >
          Merci pour votre message ! Je reviendrai vers vous rapidement afin que
          nous puissions échanger sur votre objectif.
        </motion.p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">Contact</p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">
          Parlons de votre objectif
        </h1>
      </motion.div>
      <p className="mt-3 text-slate-600">
        Laissez-moi quelques informations et je reviendrai vers vous rapidement.
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Ou contactez-moi directement : <WhatsAppLink />
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm text-slate-600">Prénom et nom *</label>
          <input required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-slate-600">Adresse e-mail *</label>
          <input required type="email" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-slate-600">Quel service vous intéresse ? *</label>
          <select
            required
            className={inputClass}
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Choisir…</option>
            <option>Coaching Running</option>
            <option>Coaching Sportif</option>
            <option>Personnalisation Textile</option>
            <option>Je ne sais pas encore</option>
          </select>
        </div>
        {!isTextile && (
          <div>
            <label className="block text-sm text-slate-600">Quel est votre objectif ? *</label>
            <input required className={inputClass} />
          </div>
        )}
        <div>
          <label className="block text-sm text-slate-600">
            Parlez-moi un peu de votre situation (facultatif)
          </label>
          <textarea rows={4} className={inputClass} />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-brand-blue py-3 text-sm font-semibold text-white active:scale-95 transition-transform sm:w-auto sm:px-8"
        >
          Envoyer ma demande
        </button>
        <p className="text-xs text-slate-400">
          Vos informations sont utilisées uniquement pour répondre à votre demande.
        </p>
      </form>
    </div>
  )
}
