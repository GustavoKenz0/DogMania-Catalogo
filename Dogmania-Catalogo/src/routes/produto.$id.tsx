import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, MessageCircle, ShieldCheck, Truck, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { buildWhatsappDetailLink } from "@/features/products/whatsapp";
import { formatPrice } from "@/lib/currency";
import { useProducts } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/produto/$id")({
  loader: ({ params }) => params.id,
  head: () => ({ meta: [{ title: "Produto — Dogmania Pet Shop" }] }),
  component: ProdutoDetalhe,
});

function ProdutoDetalhe() {
  const id = Route.useLoaderData();
  const { products } = useProducts();
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => api.getProduct(id),
    retry: false,
    refetchInterval: 30000,
  });
  if (isLoading)
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main
          role="status"
          className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground"
        >
          Carregando produto…
        </main>
        <SiteFooter />
      </div>
    );
  if (error && !(error instanceof ApiError && error.status === 404))
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main role="alert" className="px-4 py-24 text-center">
          <p className="text-muted-foreground">Não foi possível carregar este produto.</p>
          <button
            onClick={() => void refetch()}
            className="mt-4 rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground"
          >
            Tentar novamente
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  if ((error instanceof ApiError && error.status === 404) || !product || product.active === false)
    return <ProdutoNaoEncontrado />;
  const related = [
    ...products.filter(
      (item) => item.id !== id && item.active !== false && item.category === product.category,
    ),
    ...products.filter(
      (item) => item.id !== id && item.active !== false && item.category !== product.category,
    ),
  ].slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* Trilha de navegação */}
        <nav
          aria-label="Trilha de navegação"
          className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          <Link to="/" className="font-semibold hover:text-primary">
            Início
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <Link to="/produtos" className="font-semibold hover:text-primary">
            Produtos
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="line-clamp-1 text-foreground">{product.name}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Foto ampliada */}
          <div className="lg:sticky lg:top-24">
            <figure className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
              <div className="aspect-square w-full overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  width={1200}
                  height={1200}
                  fetchPriority="high"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              </div>
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow">
                  {product.badge}
                </span>
              )}
            </figure>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Passe o mouse sobre a foto para aproximar.
            </p>
          </div>

          {/* Informações */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary/70">
              {product.category}
            </span>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
              {product.name}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-6 flex flex-wrap items-baseline gap-3 rounded-xl border border-border bg-card px-4 py-4">
              <span className="font-display text-4xl font-extrabold text-primary">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-muted-foreground">preço anunciado</span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={buildWhatsappDetailLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow transition hover:brightness-95 active:scale-[0.99]"
              >
                <MessageCircle className="h-5 w-5" />
                Falar com a Dogmania
              </a>
              <Link
                to="/produtos"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-4 text-base font-bold text-foreground transition hover:bg-muted"
              >
                Continuar comprando
              </Link>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              A mensagem já vai preenchida com o nome e o preço deste produto.
            </p>

            <ul className="mt-8 grid gap-3 border-t border-border pt-6 text-sm">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-foreground">Entrega ou retirada </span>
                  combinadas direto no atendimento.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-foreground">Disponibilidade </span>
                  confirme no WhatsApp antes de finalizar.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-foreground">Pagamento </span>
                  combinado com a nossa equipe no atendimento.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Você também pode gostar
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Outros produtos da Dogmania para o seu pet.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function ProdutoNaoEncontrado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl font-extrabold text-primary">404</h1>
        <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">
          Produto não encontrado
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esse produto pode ter saído do catálogo. Veja o que temos disponível agora.
        </p>
        <div className="mt-6">
          <Link
            to="/produtos"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow transition hover:brightness-95"
          >
            Ver todos os produtos
          </Link>
        </div>
      </div>
    </div>
  );
}
