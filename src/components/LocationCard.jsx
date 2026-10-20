const CENTERS = {
  b2m: {
    name: 'Centre B2M',
    address: 'Rue du Belvédère 27, 1050 Ixelles',
    mapsQuery: 'Centre B2M, Rue du Belvédère 27, 1050 Ixelles',
  },
  aspis: {
    name: 'Centre ASPIS',
    address: 'Avenue Jacques Brel 34, 1200 Woluwe-Saint-Lambert',
    mapsQuery: 'Centre ASPIS, Avenue Jacques Brel 34, 1200 Woluwe-Saint-Lambert',
  },
}

export default function LocationCard({ centers }) {
  return (
    <ul className="mt-3 space-y-3">
      {centers.map((key) => {
        const center = CENTERS[key]
        return (
          <li key={key} className="flex items-start justify-between gap-3 text-sm text-slate-700">
            <span>
              <span className="font-semibold text-slate-900">{center.name}</span>
              <br />
              {center.address}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.mapsQuery)}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-blue"
            >
              Google Maps
            </a>
          </li>
        )
      })}
    </ul>
  )
}
