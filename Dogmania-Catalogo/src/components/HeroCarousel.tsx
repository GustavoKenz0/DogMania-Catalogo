import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";
import { WHATSAPP_NUMBER } from "@/config/store";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  cta: { label: string; to?: string; href?: string };
  accent: "yellow" | "blue" | "cream";
};

const SLIDES: Slide[] = [
  {
    image: banner1,
    eyebrow: "Dogmania Day",
    title: "Brinquedos",
    highlight: "até 50% OFF",
    description: "Para o seu pet brincar e você economizar.",
    cta: { label: "Aproveite", to: "/produtos" },
    accent: "yellow",
  },
  {
    image: banner2,
    eyebrow: "Rações Premium",
    title: "Nutrição completa",
    highlight: "Atendimento em Maringá",
    description: "Rações para cães e gatos, com atendimento próximo de você.",
    cta: { label: "Ver rações", to: "/produtos" },
    accent: "blue",
  },
  {
    image: banner3,
    eyebrow: "Mundo Gatos",
    title: "Tudo para felinos",
    highlight: "Novidades da semana",
    description: "Areia, brinquedos e acessórios para o seu melhor amigo.",
    cta: { label: "Falar no WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}` },
    accent: "cream",
  },
];

const accentBg = {
  yellow: "bg-accent text-accent-foreground",
  blue: "bg-primary text-primary-foreground",
  cream: "bg-card text-foreground",
} as const;

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="border-b border-border bg-gradient-to-b from-secondary/70 to-background py-4 sm:py-7">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="relative isolate">
          <div
            ref={emblaRef}
            className="overflow-hidden rounded-[1.5rem] shadow-elegant ring-1 ring-foreground/10 sm:rounded-[2rem]"
            aria-label="Destaques da Dogmania"
            aria-roledescription="carrossel"
          >
            <div className="flex">
              {SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className="relative min-w-0 flex-[0_0_100%]"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} de ${SLIDES.length}: ${slide.title}`}
                >
                  <div className="relative flex w-full flex-col overflow-hidden bg-card sm:aspect-[16/8] sm:bg-muted md:aspect-[16/7] lg:aspect-[16/6]">
                    <img
                      src={slide.image}
                      alt=""
                      width={1600}
                      height={700}
                      fetchPriority={i === 0 ? "high" : "low"}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="relative block aspect-[16/10] w-full object-cover object-center sm:absolute sm:inset-0 sm:aspect-auto sm:h-full"
                    />
                    <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/20 via-transparent to-transparent sm:block" />
                    <div className="relative z-10 flex items-center bg-card sm:absolute sm:inset-y-0 sm:right-0 sm:w-[47%] sm:justify-end sm:bg-transparent sm:p-5 md:w-[44%] lg:p-7">
                      <div className="w-full max-w-xl px-5 py-5 sm:rounded-2xl sm:bg-background/90 sm:px-7 sm:py-7 sm:shadow-xl sm:backdrop-blur-md md:px-8 md:py-8">
                        <span
                          className={
                            "inline-flex rounded-full px-3 py-1 text-[0.7rem] font-extrabold uppercase tracking-wide shadow-sm sm:text-xs " +
                            accentBg[slide.accent]
                          }
                        >
                          {slide.eyebrow}
                        </span>
                        <h2 className="mt-2 font-display text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-foreground sm:mt-3 sm:text-4xl lg:text-5xl">
                          {slide.title}
                        </h2>
                        <p className="mt-1.5 font-display text-lg font-extrabold leading-tight text-accent sm:mt-2 sm:text-xl md:text-2xl">
                          {slide.highlight}
                        </p>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-3 md:text-base">
                          {slide.description}
                        </p>
                        {slide.cta.to ? (
                          <Link
                            to={slide.cta.to}
                            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-extrabold text-accent-foreground shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:mt-5 sm:bg-primary sm:text-primary-foreground"
                          >
                            {slide.cta.label}
                          </Link>
                        ) : (
                          <a
                            href={slide.cta.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-extrabold text-accent-foreground shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:mt-5"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {slide.cta.label}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-[18%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/30 text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:left-4 sm:top-1/2 sm:h-12 sm:w-12 sm:border-border/70 sm:bg-background/90 sm:text-foreground sm:hover:bg-background"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-[18%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/30 text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:right-4 sm:top-1/2 sm:h-12 sm:w-12 sm:border-border/70 sm:bg-background/90 sm:text-foreground sm:hover:bg-background"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-2 flex justify-center gap-1.5 sm:absolute sm:inset-x-0 sm:bottom-3 sm:z-10 sm:mt-0 sm:gap-2 md:bottom-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para slide ${i + 1}`}
                aria-current={selected === i ? "true" : undefined}
                onClick={() => emblaApi?.scrollTo(i)}
                className={
                  "flex h-8 min-w-8 items-center justify-center rounded-full px-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-7 sm:min-w-7 " +
                  (selected === i
                    ? "bg-primary/10 sm:bg-black/35"
                    : "bg-transparent hover:bg-primary/10 sm:hover:bg-black/20")
                }
              >
                <span
                  className={
                    "h-1.5 rounded-full shadow-sm transition-all " +
                    (selected === i
                      ? "w-6 bg-primary sm:bg-accent"
                      : "w-1.5 bg-primary/40 sm:bg-white/80")
                  }
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
