import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  MapPin,
  MessageCircle,
  PawPrint,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { CatalogHeader } from "@/components/CatalogHeader";
import { PetDrawing, type PetDrawingKind } from "@/components/PetDrawing";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroCarousel } from "@/components/HeroCarousel";
import { WHATSAPP_NUMBER } from "@/config/store";
import type { CatalogCategory, Category } from "@/features/products/model";
import { useProducts } from "@/hooks/useProducts";

const departments: {
  category: Category;
  drawing: PetDrawingKind;
  description: string;
  color: string;
}[] = [
  {
    category: "Rações",
    drawing: "bowl",
    description: "Boas escolhas para a hora de comer.",
    color: "bg-[#fff6df]",
  },
  {
    category: "Higiene",
    drawing: "bath",
    description: "Carinho também nos pequenos cuidados.",
    color: "bg-[#edf4ff]",
  },
  {
    category: "Brinquedos",
    drawing: "play",
    description: "Mais diversão para os melhores momentos.",
    color: "bg-[#f3f1ff]",
  },
];
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dogmania Pet Shop — Cuidado para o seu pet em Maringá" },
      {
        name: "description",
        content:
          "Encontre rações, higiene, brinquedos e produtos para o seu pet na Dogmania, em Maringá. Explore o catálogo e compre pelo WhatsApp.",
      },
      { property: "og:title", content: "Dogmania Pet Shop — Cuidado para o seu pet" },
      {
        property: "og:description",
        content:
          "Carinho em cada escolha. Conheça nosso catálogo e fale com a equipe da Dogmania pelo WhatsApp.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { products, isLoading, error, refetch } = useProducts();
  const featured = useMemo(
    () => products.filter((product) => product.active !== false).slice(0, 4),
    [products],
  );
  const openCatalog = (category: CatalogCategory = "Todos") => {
    void navigate({
      to: "/produtos",
      search: {
        busca: query.trim() || undefined,
        categoria: category === "Todos" ? undefined : category,
      },
    });
  };

  return (
    <div className="home-page min-h-screen bg-background">
      <CatalogHeader
        query={query}
        onQueryChange={setQuery}
        activeCategory="Todos"
        onCategoryChange={openCatalog}
        onSearchSubmit={() => openCatalog()}
      />

      <main>
        <section className="catalog-intro" aria-labelledby="home-title">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-6 sm:px-6 sm:py-8">
            <div>
              <p className="catalog-intro-eyebrow">Dogmania · pertinho de você e do seu pet</p>
              <h1
                id="home-title"
                className="mt-2 font-display text-2xl font-extrabold leading-tight text-primary sm:text-3xl lg:text-4xl"
              >
                Carinho em cada escolha.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Tudo para deixar a vida do seu melhor amigo mais feliz.
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-4 py-2.5 text-sm font-bold text-primary sm:inline-flex">
              <MapPin size={17} aria-hidden="true" /> Maringá, PR
            </span>
          </div>
        </section>

        <HeroCarousel />

        <section
          aria-label="A Dogmania perto de você"
          className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4"
        >
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="home-service-item group"
            >
              <span className="home-service-icon">
                <MessageCircle size={22} aria-hidden="true" />
              </span>
              <span>
                <span className="home-service-title">Peça pelo WhatsApp</span>
                <span className="home-service-description">Converse com a nossa equipe</span>
              </span>
              <ArrowUpRight
                size={16}
                className="ml-auto shrink-0 text-primary/60 transition group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Avenida+Humaita+299+Zona+04+Maringa+PR+87014-200"
              target="_blank"
              rel="noopener noreferrer"
              className="home-service-item group"
            >
              <span className="home-service-icon">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <span>
                <span className="home-service-title">Visite a nossa loja</span>
                <span className="home-service-description">Av. Humaitá, 299 · Maringá</span>
              </span>
              <ArrowUpRight
                size={16}
                className="ml-auto shrink-0 text-primary/60 transition group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
            <Link to="/produtos" className="home-service-item group">
              <span className="home-service-icon">
                <HeartHandshake size={22} aria-hidden="true" />
              </span>
              <span>
                <span className="home-service-title">Cuidado para cada pet</span>
                <span className="home-service-description">Conheça os nossos produtos</span>
              </span>
              <ArrowRight
                size={16}
                className="ml-auto shrink-0 text-primary/60 transition group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="home-featured-title"
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="catalog-intro-eyebrow">Boas escolhas, todos os dias</p>
              <h2
                id="home-featured-title"
                className="mt-2 font-display text-2xl font-extrabold text-primary md:text-3xl"
              >
                Destaques da loja
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Encontre o próximo favorito do seu pet.
              </p>
            </div>
            <Link
              to="/produtos"
              className="inline-flex min-h-11 self-start items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:border-primary hover:bg-secondary"
            >
              Explorar catálogo <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-border bg-card p-8 text-center sm:p-10"
            >
              <p className="font-bold text-primary">Não foi possível carregar os produtos agora.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tente novamente ou fale com a nossa equipe pelo WhatsApp.
              </p>
              <button
                onClick={() => void refetch()}
                className="mt-5 min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              >
                Tentar novamente
              </button>
            </div>
          ) : isLoading ? (
            <div
              role="status"
              aria-label="Carregando produtos"
              className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="overflow-hidden rounded-xl border border-border bg-white"
                >
                  <div className="aspect-square animate-pulse bg-secondary" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-secondary" />
                    <div className="h-6 w-1/2 animate-pulse rounded bg-secondary" />
                    <div className="h-10 animate-pulse rounded-lg bg-secondary" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Carregando produtos da loja…</span>
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
              <PawPrint size={28} className="mx-auto text-primary/60" aria-hidden="true" />
              <p className="mt-3 font-bold text-primary">
                Estamos preparando novas escolhas para o seu pet.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Enquanto isso, nossa equipe pode ajudar pelo WhatsApp.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white"
              >
                <MessageCircle size={17} aria-hidden="true" /> Fale com a loja
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section
          aria-labelledby="home-departments-title"
          className="border-y border-border bg-[#f5f7fc]"
        >
          <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
            <p className="catalog-intro-eyebrow">Para todos os momentos</p>
            <h2
              id="home-departments-title"
              className="mt-2 font-display text-2xl font-extrabold text-primary md:text-3xl"
            >
              Um cuidado para cada rotina.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-5">
              {departments.map(({ category, drawing, description, color }) => (
                <Link
                  key={category}
                  to="/produtos"
                  search={{ categoria: category }}
                  className={`home-department group ${color}`}
                >
                  <span className="home-department-pet">
                    <PetDrawing kind={drawing} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold text-primary">
                      {category}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </span>
                  </span>
                  <span className="home-department-arrow">
                    <ArrowRight size={19} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="home-contact-title"
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
        >
          <div className="home-contact-card">
            <div className="relative z-10 max-w-xl">
              <p className="text-xs font-extrabold uppercase tracking-[.13em] text-primary/70">
                Pode chamar a Dogmania
              </p>
              <h2
                id="home-contact-title"
                className="mt-2 font-display text-2xl font-extrabold leading-tight text-primary sm:text-3xl"
              >
                Uma ajudinha para escolher?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Conte o que seu pet precisa. Nossa equipe ajuda você a encontrar os produtos da loja
                e combinar a compra pelo WhatsApp.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-glow"
              >
                <MessageCircle size={19} aria-hidden="true" /> Conversar com a loja{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
            <div className="home-contact-pets" aria-hidden="true">
              <span>
                <PetDrawing kind="dog" />
              </span>
              <span>
                <PetDrawing kind="cat" />
              </span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
