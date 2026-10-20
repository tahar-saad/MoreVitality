import { Link } from 'react-router-dom'
import WhatsAppLink from './WhatsAppLink'

const sitemap = [
  {
    title: 'Activités',
    links: [
      { to: '/coaching-sportif', label: 'Coaching Sportif' },
      { to: '/coaching-running', label: 'Coaching Running' },
      { to: '/personnalisation-textile', label: 'Personnalisation Textile' },
    ],
  },
  {
    title: 'À propos',
    links: [
      { to: '/qui-suis-je', label: 'Qui suis-je ?' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Contact',
    links: [{ to: '/contact', label: 'Prendre contact' }],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {sitemap.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-slate-600 hover:text-slate-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <img src="/icons/logo-full.svg" alt="More Vitality" className="h-8 w-auto" />
          <span className="flex flex-wrap items-center gap-3">
            <WhatsAppLink />
            <span>· Bruxelles</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
