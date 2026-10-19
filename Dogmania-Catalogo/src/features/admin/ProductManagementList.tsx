import { Pencil, Power, Trash2 } from "lucide-react";
import type { Product } from "@/features/products/model";
import { formatPrice } from "@/lib/currency";

export function ProductManagementList({
  products,
  busy,
  onEdit,
  onDelete,
  onToggle,
}: {
  products: Product[];
  busy: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggle: (product: Product) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {products.map((product) => {
        const active = product.active !== false;
        return (
          <article
            key={product.id}
            className={`flex flex-col gap-4 p-5 xl:flex-row xl:items-center ${active ? "" : "bg-muted/35"}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <img
                src={product.image}
                alt=""
                loading="lazy"
                className={`h-20 w-20 shrink-0 rounded-xl border border-border bg-muted object-contain ${active ? "" : "grayscale opacity-60"}`}
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <h3 className="mt-1 break-words text-sm font-bold sm:text-base">{product.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <strong className="text-base text-primary">{formatPrice(product.price)}</strong>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
                  >
                    {active ? "À venda" : "Sem estoque"}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                disabled={busy}
                onClick={() => onToggle(product)}
                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
              >
                <Power className="h-4 w-4" />
                {active ? "Marcar sem estoque" : "Voltar ao estoque"}
              </button>
              <button
                disabled={busy}
                onClick={() => onEdit(product)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
              <button
                disabled={busy}
                onClick={() => onDelete(product)}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
