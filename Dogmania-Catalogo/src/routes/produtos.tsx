import { createFileRoute } from "@tanstack/react-router";
import { CatalogHeader } from "@/components/CatalogHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogGrid } from "@/components/CatalogGrid";
import { isCategory, type Category, type CatalogCategory } from "@/features/products/model";
import { isSubcategory } from "@/features/products/taxonomy";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Dogmania Pet Shop" },
      {
        name: "description",
        content:
          "Encontre produtos para cães, gatos, pássaros, peixes e outros pets. Rações, brinquedos e higiene na Dogmania.",
      },
      { property: "og:title", content: "Produtos — Dogmania Pet Shop" },
      {
        property: "og:description",
        content: "Tudo para o seu pet: explore o catálogo por categoria e compre pelo WhatsApp.",
      },
    ],
  }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { busca?: string; categoria?: Category; subcategoria?: string } => {
    const categoria = isCategory(search.categoria) ? search.categoria : undefined;
    return {
      busca: typeof search.busca === "string" && search.busca.trim() ? search.busca : undefined,
      categoria,
      subcategoria:
        categoria && isSubcategory(categoria, search.subcategoria)
          ? search.subcategoria
          : undefined,
    };
  },
  component: ProdutosPage,
});

function ProdutosPage() {
  const { busca, categoria, subcategoria } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeCategory: CatalogCategory = categoria ?? "Todos";

  const changeQuery = (value: string) => {
    void navigate({
      search: (previous) => ({ ...previous, busca: value || undefined }),
      replace: true,
      resetScroll: false,
    });
  };
  const changeCategory = (value: CatalogCategory, subcategory?: string) => {
    void navigate({
      search: (previous) => ({
        ...previous,
        categoria: value === "Todos" ? undefined : value,
        subcategoria: subcategory,
      }),
      resetScroll: false,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader
        query={busca ?? ""}
        onQueryChange={changeQuery}
        activeCategory={activeCategory}
        onCategoryChange={changeCategory}
        activeSubcategory={subcategoria}
      />

      <section className="catalog-intro">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <p className="catalog-intro-eyebrow">Cuidado, carinho e boas escolhas</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-primary sm:text-3xl lg:text-4xl">
            Tudo para o seu melhor amigo.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Escolha a categoria, encontre o que seu pet precisa e conte com a Dogmania pelo
            WhatsApp.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <CatalogGrid
          query={busca ?? ""}
          activeCategory={activeCategory}
          activeSubcategory={subcategoria}
          onClearSubcategory={() => changeCategory(activeCategory)}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
