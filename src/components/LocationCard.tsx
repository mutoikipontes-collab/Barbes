import { addressText, downloadIcs, googleCalendarUrl, googleMapsUrl, hasLocation, mapEmbedUrl, wazeUrl, type Address } from '@/lib/location'

type Props = {
  shopName: string
  address: Address | null | undefined
  /** Quando informado, mostra os botões de salvar o horário na agenda do celular. */
  event?: { title: string; startsAt: string; endsAt: string; details: string }
  showMap?: boolean
}

const linkBtn = 'inline-flex min-h-11 items-center justify-center rounded-xs border border-ink-700 px-4 text-sm font-semibold hover:border-gold-500'

/** Mapa da barbearia + "como chegar" + "salvar na agenda". */
export function LocationCard({ shopName, address, event, showMap = true }: Props) {
  const located = hasLocation(address)
  const text = addressText(address)

  return (
    <div className="space-y-3">
      {located && address ? (
        <>
          <div>
            <p className="text-sm text-ink-300">Onde fica</p>
            <p className="font-medium">{shopName}</p>
            {text ? <p className="text-ink-300">{text}</p> : null}
          </div>
          {showMap ? (
            <iframe
              title={`Mapa: ${shopName}`}
              src={mapEmbedUrl(shopName, address)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-48 w-full rounded-xs border border-ink-700 bg-ink-800"
            />
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <a href={googleMapsUrl(shopName, address)} target="_blank" rel="noreferrer" className={linkBtn}>Google Maps</a>
            <a href={wazeUrl(shopName, address)} target="_blank" rel="noreferrer" className={linkBtn}>Waze</a>
          </div>
        </>
      ) : null}
      {event ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => downloadIcs({ ...event, location: text || shopName }, 'agendamento.ics')}
            className={linkBtn}
          >
            Salvar na agenda
          </button>
          <a href={googleCalendarUrl({ ...event, location: text || shopName })} target="_blank" rel="noreferrer" className={linkBtn}>
            Google Agenda
          </a>
        </div>
      ) : null}
    </div>
  )
}
