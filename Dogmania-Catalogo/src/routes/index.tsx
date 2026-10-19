import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroCarousel } from "@/components/HeroCarousel";
import { useProducts } from "@/hooks/useProducts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dogmania Pet Shop — Catálogo Digital" },
      {
        name: "description",
        content:
          "Catálogo digital da Dogmania Pet Shop. Rações, brinquedos, higiene e acessórios para cães e gatos. Compre via WhatsApp.",
      },
      { property: "og:title", content: "Dogmania Pet Shop — Catálogo Digital" },
      {
        property: "og:description",
        content:
          "Rações, brinquedos, higiene e acessórios para cães e gatos. Atendimento direto via WhatsApp.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const { products, isLoading, error, refetch } = useProducts();

  const featured = useMemo(() => {
    const q = query.trim().toLowerCase();
    const activeProducts = products.filter((p) => p.active !== false);
    const base = q
      ? activeProducts.filter((p) => p.name.toLowerCase().includes(q))
      : activeProducts;
    return base.slice(0, 4);
  }, [query, products]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader query={query} onQueryChange={setQuery} />

      <HeroCarousel />

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
              Destaques da semana
            </h2>
            <p className="text-sm text-muted-foreground">Produtos selecionados para o seu pet</p>
          </div>
          <Link
            to="/produtos"
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow transition hover:brightness-110 sm:self-auto"
          >
            Ver todos os produtos
          </Link>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Não foi possível carregar os produtos agora.</p>
            <button
              onClick={() => void refetch()}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading ? (
          <p role="status" className="py-12 text-center text-muted-foreground">
            Carregando os produtos da loja…
          </p>
        ) : featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
