import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import type { Product } from "@/features/products/model";
import { buildWhatsappLink } from "@/features/products/whatsapp";
import { formatPrice } from "@/lib/currency";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant">
      <Link
        to="/produto/$id"
        params={{ id: product.id }}
        aria-label={`Ver detalhes de ${product.name}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link
          to="/produto/$id"
          params={{ id: product.id }}
          className="text-xs font-semibold uppercase tracking-wide text-primary/70 hover:text-primary"
        >
          {product.category}
        </Link>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          <Link
            to="/produto/$id"
            params={{ id: product.id }}
            className="transition hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto text-2xl font-extrabold text-primary">
          {formatPrice(product.price)}
        </p>

        <a
          href={buildWhatsappLink(product)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground shadow transition hover:brightness-95 active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" />
          Comprar via WhatsApp
        </a>
      </div>
    </article>
  );
}
