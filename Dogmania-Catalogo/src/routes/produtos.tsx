import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogGrid } from "@/components/CatalogGrid";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Dogmania Pet Shop" },
      { name: "description", content: "Catálogo completo de produtos da Dogmania: rações, brinquedos, higiene e acessórios para cães e gatos." },
      { property: "og:title", content: "Produtos — Dogmania Pet Shop" },
      { property: "og:description", content: "Catálogo completo: rações, brinquedos, higiene e acessórios." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { busca?: string } => ({
    busca:
      typeof search.busca === "string" && search.busca.trim() ? search.busca : undefined,
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const { busca } = Route.useSearch();
  const [query, setQuery] = useState(busca ?? "");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader query={query} onQueryChange={setQuery} />

      <section className="border-b border-border bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">
            Todos os produtos
          </h1>
          <p className="mt-2 max-w-prose text-primary-foreground/85">
            Explore nosso catálogo completo e fale com a gente pelo WhatsApp para finalizar a compra.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <CatalogGrid query={query} />
      </main>

      <SiteFooter />
    </div>
  );
}
