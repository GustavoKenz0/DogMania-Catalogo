import {
  Clock3,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

const sectionTitleClass =
  "font-display text-xs font-extrabold uppercase leading-snug tracking-[0.1em] text-primary-foreground sm:text-sm sm:tracking-[0.12em]";
const mutedTextClass = "text-[0.8rem] leading-relaxed text-primary-foreground/75 sm:text-sm";
const footerLinkClass =
  "inline-flex min-h-9 items-center gap-2 rounded-md text-[0.8rem] font-semibold text-primary-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:min-h-10 sm:text-sm";

const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=Avenida+Humaita+299+Zona+04+Maringa+PR+87014-200";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-primary-foreground/10 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-6 px-4 py-7 sm:gap-x-8 sm:gap-y-7 sm:px-8 sm:py-9 lg:grid-cols-[1.2fr_1fr_1.15fr_0.8fr] lg:gap-8 lg:px-10">
        <section aria-labelledby="footer-location">
          <h2 id="footer-location" className={sectionTitleClass}>
            <MapPin className="mr-2 inline h-4 w-4 text-accent" aria-hidden="true" />
            Encontre a loja
          </h2>
          <address className={`mt-2.5 not-italic ${mutedTextClass}`}>
            Av. Humaitá, 299
            <br />
            Zona 04, Maringá - PR
            <br />
            CEP 87014-200
          </address>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${footerLinkClass} mt-1 text-accent`}
          >
            Ver rota no mapa
            <span aria-hidden="true">↗</span>
          </a>
        </section>

        <section aria-labelledby="footer-hours">
          <h2 id="footer-hours" className={sectionTitleClass}>
            <Clock3 className="mr-2 inline h-4 w-4 text-accent" aria-hidden="true" />
            Horário de funcionamento
          </h2>
          <dl className={`mt-2.5 space-y-1.5 ${mutedTextClass}`}>
            <div className="flex justify-between gap-2">
              <dt className="text-primary-foreground">Segunda a sexta</dt>
              <dd className="shrink-0 tabular-nums">08:30–19:00</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-primary-foreground">Sábado</dt>
              <dd className="shrink-0 tabular-nums">08:30–13:00</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-primary-foreground">Domingo</dt>
              <dd className="shrink-0">Fechado</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact" className={sectionTitleClass}>
            <Phone className="mr-2 inline h-4 w-4 text-accent" aria-hidden="true" />
            Fale com a Dogmania
          </h2>
          <div className="mt-1.5 flex flex-col items-start">
            <a href="tel:+554432250871" className={footerLinkClass}>
              (44) 3225-0871
            </a>
            <a href="tel:+554430317871" className={footerLinkClass}>
              (44) 3031-7871
            </a>
            <a
              href="https://wa.me/554499865542"
              target="_blank"
              rel="noopener noreferrer"
              className={`${footerLinkClass} mt-1 text-accent`}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp · (44) 9986-5542
            </a>
          </div>
        </section>

        <section aria-labelledby="footer-social">
          <h2 id="footer-social" className={sectionTitleClass}>
            Acompanhe
          </h2>
          <p className={`mt-2.5 ${mutedTextClass}`}>Novidades e dicas para o seu pet.</p>
          <a
            href="https://www.instagram.com/dogmaniamaringa/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Dogmania no Instagram (abre em nova aba)"
          className={`${footerLinkClass} mt-1 text-accent`}
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
            @dogmaniamaringa
          </a>
        </section>
      </div>

      <div className="border-t border-primary-foreground/15">
        <p className="mx-auto max-w-7xl px-4 py-3 text-xs text-primary-foreground/60 sm:px-8 lg:px-10">
          © {new Date().getFullYear()} Dogmania Pet Shop
        </p>
      </div>
    </footer>
  );
}
