import { useMemo, useState } from "react";
import { CATEGORIES, type Category } from "@/features/products/model";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Sparkles } from "lucide-react";

export function CatalogGrid({ query }: { query: string }) {
  const [activeCategory, setActiveCategory] = useState<Category | "Todos">("Todos");
  const { products, isLoading, error, refetch } = useProducts();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCategory === "Todos" || p.category === activeCategory;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      return p.active !== false && matchCat && matchQ;
    });
  }, [query, activeCategory, products]);

  return (
    <section aria-labelledby="catalog-heading" className="w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="catalog-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Catálogo de Produtos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Carregando catálogo..."
              : `${filtered.length} ${filtered.length === 1 ? "produto disponível" : "produtos disponíveis"}`}
          </p>
        </div>
      </div>

      {/* Filtro por Categorias */}
      <div
        className="mb-8 flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Filtrar por categorias"
      >
        {(["Todos", ...CATEGORIES] as const).map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(cat)}
              className={
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                (active
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-secondary text-secondary-foreground hover:bg-muted hover:scale-102")
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Skeletons durante loading */}
      {error ? (
        <div role="alert" className="rounded-2xl border border-border bg-card p-10 text-center">
          <h3 className="font-bold">O catálogo está temporariamente indisponível</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente novamente em alguns instantes ou fale com a loja pelo WhatsApp.
          </p>
          <button
            onClick={() => void refetch()}
            className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex flex-col rounded-xl border border-border bg-card p-4"
            >
              <div className="aspect-square w-full rounded-lg bg-muted mb-4" />
              <div className="h-4 w-1/3 rounded bg-muted mb-2" />
              <div className="h-5 w-3/4 rounded bg-muted mb-4" />
              <div className="h-6 w-1/2 rounded bg-muted mt-auto" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Não encontramos nenhum item correspondente aos critérios informados. Tente buscar por
            outros termos ou selecione outra categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
