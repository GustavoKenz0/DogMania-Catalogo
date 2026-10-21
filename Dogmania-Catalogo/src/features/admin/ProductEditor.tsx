import { useEffect, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { CATEGORIES, type Category, type Product } from "@/features/products/model";
import { api } from "@/lib/api";
import { getSubcategories, isSubcategory } from "@/features/products/taxonomy";

type ProductForm = Omit<Product, "id">;
const field =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";
const blank: ProductForm = {
  name: "",
  description: "",
  image: "",
  price: 0,
  category: "Cães",
  badge: "",
  active: true,
};

export function ProductEditor({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (form: ProductForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ProductForm>(
    product
      ? {
          name: product.name,
          description: product.description,
          image: product.image,
          price: product.price,
          category: product.category,
          subcategory: product.subcategory,
          badge: product.badge,
          active: product.active,
        }
      : blank,
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setImageFailed(false);
  }, [form.image]);
  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
      return;
    }
    setBusy(true);
    setUploading(true);
    try {
      update("image", (await api.uploadImage(file)).url);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível enviar a foto. Tente novamente.",
      );
    } finally {
      setBusy(false);
      setUploading(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || !form.description.trim()) {
      setError("Preencha o nome e a descrição do produto.");
      return;
    }
    if (!Number.isFinite(form.price) || form.price <= 0 || form.price > 99999999.99) {
      setError("Informe um preço válido, maior que zero.");
      return;
    }
    try {
      if (new URL(form.image).protocol !== "https:") throw new Error();
    } catch {
      setError("Informe o endereço completo da imagem começando com https://.");
      return;
    }
    setBusy(true);
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        badge: form.badge?.trim() || undefined,
        subcategory: form.subcategory?.trim() || undefined,
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível salvar. Seus dados continuam no formulário.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            nameRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onInteractOutside={(event) => event.preventDefault()}
          className="fixed bottom-0 left-1/2 z-50 max-h-[95dvh] w-full -translate-x-1/2 overflow-y-auto rounded-t-2xl bg-card shadow-2xl sm:bottom-auto sm:top-1/2 sm:max-w-2xl sm:-translate-y-1/2 sm:rounded-2xl"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-5 sm:px-7">
            <div>
              <Dialog.Title className="font-display text-xl font-extrabold">
                {product ? "Editar produto" : "Adicionar produto"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Preencha as informações que os clientes verão na loja.
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={busy}
              aria-label="Fechar formulário"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={submit}>
            <fieldset disabled={busy} className="space-y-5 px-5 py-6 sm:px-7">
              <legend className="sr-only">Informações do produto</legend>
              <label className="block text-sm font-bold">
                Nome do produto <span className="text-destructive">*</span>
                <input
                  ref={nameRef}
                  required
                  maxLength={150}
                  className={field}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ex.: Ração para cães adultos 10 kg"
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold">
                  Preço (R$) <span className="text-destructive">*</span>
                  <input
                    required
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    max="99999999.99"
                    step="0.01"
                    className={field}
                    value={form.price || ""}
                    onChange={(e) => update("price", Number(e.target.value))}
                    placeholder="0,00"
                  />
                </label>
                <label className="block text-sm font-bold">
                  Categoria <span className="text-destructive">*</span>
                  <select
                    className={field}
                    value={form.category}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        category: e.target.value as Category,
                        subcategory: undefined,
                      }))
                    }
                  >
                    {!CATEGORIES.includes(form.category) && <option>{form.category}</option>}
                    {CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-bold">
                Subcategoria
                <select
                  className={field}
                  value={form.subcategory ?? ""}
                  onChange={(e) => update("subcategory", e.target.value || undefined)}
                >
                  <option value="">Sem subcategoria</option>
                  {form.subcategory && !isSubcategory(form.category, form.subcategory) && (
                    <option value={form.subcategory}>{form.subcategory}</option>
                  )}
                  {getSubcategories(form.category).map(({ label }) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Define em qual opção do menu este produto será encontrado.
                </span>
              </label>
              <label className="block text-sm font-bold">
                Descrição <span className="text-destructive">*</span>
                <textarea
                  required
                  maxLength={800}
                  rows={4}
                  className={`${field} resize-y`}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Conte o que o produto oferece e para qual pet ele é indicado."
                />
                <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">
                  {form.description.length}/800
                </span>
              </label>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <label className="block text-sm font-bold">
                  Link da foto <span className="text-destructive">*</span>
                  <input
                    required
                    type="url"
                    maxLength={2048}
                    pattern="https://.*"
                    className={field}
                    value={form.image}
                    onChange={(e) => update("image", e.target.value)}
                    placeholder="https://seusite.com/foto-do-produto.jpg"
                  />
                </label>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Cole o endereço HTTPS de uma imagem já publicada ou envie uma foto do dispositivo.
                </p>
                <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm font-bold text-primary">
                  {uploading ? "Enviando foto…" : "Escolher foto do dispositivo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      void upload(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">
                  JPG, PNG ou WebP. Máximo de 5 MB.
                </p>
                {form.image.startsWith("https://") && (
                  <div className="mt-4 flex items-center gap-4">
                    {!imageFailed ? (
                      <img
                        src={form.image}
                        alt="Prévia da foto do produto"
                        onError={() => setImageFailed(true)}
                        className="h-24 w-24 rounded-lg border border-border bg-white object-contain"
                      />
                    ) : (
                      <p className="text-xs text-amber-800">
                        A prévia não carregou. Confira se o link abre uma imagem pública.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <label className="block text-sm font-bold">
                Selo <span className="font-normal text-muted-foreground">(opcional)</span>
                <input
                  maxLength={30}
                  className={field}
                  value={form.badge ?? ""}
                  onChange={(e) => update("badge", e.target.value)}
                  placeholder="Ex.: Novidade ou Mais vendido"
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={form.active !== false}
                  onChange={(e) => update("active", e.target.checked)}
                />
                <span>
                  <strong className="block text-sm">Disponível para venda</strong>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    Desmarque se estiver sem estoque. O produto será salvo e ficará oculto da loja.
                  </span>
                </span>
              </label>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </fieldset>
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-card px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-xl border border-border px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {busy ? "Salvando…" : product ? "Salvar alterações" : "Cadastrar produto"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
