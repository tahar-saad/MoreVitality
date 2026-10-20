const PHONE_DISPLAY = '+32 470 34 95 66'
const PHONE_TEL = '+32470349566' // format tel: (accepte les espaces à l'affichage, pas dans le lien)
const PHONE_WHATSAPP = '32470349566' // format wa.me : chiffres uniquement, sans le +

export default function WhatsAppLink({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <a href={`tel:${PHONE_TEL}`} className="hover:underline">
        {PHONE_DISPLAY}
      </a>
      <a
        href={`https://wa.me/${PHONE_WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter Maxime sur WhatsApp"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12.017 2C6.499 2 2 6.477 2 11.972c0 1.99.523 3.856 1.437 5.474L2 22l4.696-1.408a10.02 10.02 0 0 0 5.32 1.517h.001c5.518 0 10.017-4.478 10.017-9.97C22 6.478 17.519 2 12.017 2zm0 18.155h-.001a8.29 8.29 0 0 1-4.223-1.155l-.303-.18-3.14.942.84-3.06-.198-.314a8.166 8.166 0 0 1-1.271-4.416c0-4.521 3.686-8.199 8.3-8.199a8.26 8.26 0 0 1 5.87 2.428 8.14 8.14 0 0 1 2.427 5.79c0 4.522-3.686 8.164-8.301 8.164z" />
        </svg>
      </a>
    </span>
  )
}
