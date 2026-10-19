import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LogOut,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Store,
} from "lucide-react";
import { api, isAdminRole, type AdminUser } from "@/lib/api";
import { useProducts } from "@/hooks/useProducts";
import { type Product } from "@/features/products/model";
import { ProductEditor } from "./ProductEditor";
import { ProductManagementList } from "./ProductManagementList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Não foi possível concluir a operação.";

export function AdminPage() {
  const client = useQueryClient();
  const [session, setSession] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      if (!api.getToken()) api.removeToken();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [session]);
  useEffect(() => {
    let mounted = true;
    const clear = () => {
      setSession(null);
      client.removeQueries({ queryKey: ["products", "admin"] });
    };
    window.addEventListener("dogmania-auth-changed", clear);
    localStorage.removeItem("dogmania-admin-session-v1");
    localStorage.removeItem("dogmania_token");
    if (api.getToken()) {
      api
        .me()
        .then((user) => {
          if (mounted && isAdminRole(user.role)) setSession(user);
          else api.removeToken();
        })
        .catch(() => api.removeToken())
        .finally(() => {
          if (mounted) setChecking(false);
        });
    } else setChecking(false);
    return () => {
      mounted = false;
      window.removeEventListener("dogmania-auth-changed", clear);
    };
  }, [client]);
  if (checking)
    return (
      <main className="grid min-h-screen place-items-center bg-muted/30">
        <p role="status" className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Verificando seu acesso…
        </p>
      </main>
    );
  return session ? (
    <AdminDashboard session={session} onLogout={() => api.removeToken()} />
  ) : (
    <AdminLogin onLogin={setSession} />
  );
}

function AdminLogin({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(await api.login(email.trim(), password));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen bg-muted/35 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[60px] border-white/5"
          aria-hidden="true"
        />
        <p className="font-display text-2xl font-extrabold">
          Dogmania<span className="text-accent">.</span>{" "}
          <span className="text-sm font-normal text-white/65">Pet Shop</span>
        </p>
        <div className="relative max-w-md">
          <span className="mb-6 inline-flex rounded-2xl bg-white/10 p-4">
            <Store className="h-8 w-8 text-accent" />
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Sua loja organizada.
            <br />
            Seu catálogo atualizado.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/75">
            Um espaço para cadastrar produtos, ajustar preços e cuidar do que aparece para seus
            clientes.
          </p>
        </div>
        <p className="text-sm text-white/60">Acesso exclusivo para a equipe Dogmania</p>
      </aside>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <span className="inline-flex rounded-2xl bg-primary/10 p-3.5 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <p className="mt-7 text-xs font-bold uppercase tracking-widest text-primary">
            Painel da loja
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Bem-vindo de volta</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Entre com o e-mail e a senha fornecidos pela administração.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-bold">
              E-mail
              <input
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                disabled={busy}
              />
            </label>
            <label className="block text-sm font-bold">
              Senha
              <div className="relative">
                <input
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  className={`${fieldClass} pr-12`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {busy ? "Entrando…" : "Entrar no painel"}
            </button>
          </form>
          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para a loja
          </Link>
        </div>
      </section>
    </main>
  );
}

function AdminDashboard({ session, onLogout }: { session: AdminUser; onLogout: () => void }) {
  const { products, isLoading, error, refetch, refresh } = useProducts(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const active = products.filter((p) => p.active !== false).length;
  const filtered = products.filter(
    (p) =>
      (!search.trim() ||
        `${p.name} ${p.category}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.trim().toLocaleLowerCase("pt-BR"))) &&
      (status === "all" || (status === "active" ? p.active !== false : p.active === false)),
  );
  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setFailure("");
    setNotice("");
    try {
      await action();
      await refresh();
      setNotice(message);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen bg-[#f5f6fa] text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-accent">
              <Store className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold">Dogmania</p>
              <p className="text-xs text-muted-foreground">Administração do catálogo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:block">
              Olá, {session.name}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted sm:inline-flex"
            >
              <Store className="h-4 w-4" /> Ver loja
            </a>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Sua loja em dia
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-extrabold">Produtos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre novidades e atualize o que seus clientes encontram na loja.
            </p>
          </div>
          <button
            onClick={() => setEditor("new")}
            disabled={isLoading || Boolean(error) || busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50"
          >
            <Plus className="h-5 w-5" /> Adicionar produto
          </button>
        </div>
        <div className="mb-7 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "Cadastrados", value: products.length },
            { label: "À venda", value: active },
            { label: "Sem estoque", value: products.length - active },
          ].map((item, index) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-3.5 sm:p-5">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{item.label}</p>
              <p
                className={`mt-2 font-display text-2xl font-extrabold sm:text-3xl ${index === 1 ? "text-emerald-700" : "text-primary"}`}
              >
                {isLoading || error ? "—" : item.value}
              </p>
            </div>
          ))}
        </div>
        {notice && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
          >
            {notice}
          </p>
        )}
        {failure && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
          >
            {failure}
          </p>
        )}
        <section
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          aria-label="Gerenciar produtos"
        >
          <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative w-full lg:max-w-sm">
              <span className="sr-only">Buscar por nome ou categoria</span>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                className={`${fieldClass} mt-0 pl-10`}
                placeholder="Buscar por nome ou categoria"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="flex gap-1 rounded-xl bg-muted p-1" aria-label="Filtrar produtos">
              {[
                { id: "all", label: "Todos" },
                { id: "active", label: "À venda" },
                { id: "inactive", label: "Sem estoque" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  aria-pressed={status === tab.id}
                  onClick={() => setStatus(tab.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold sm:text-sm ${status === tab.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <p
              role="status"
              className="flex items-center justify-center gap-3 p-16 text-muted-foreground"
            >
              <LoaderCircle className="h-5 w-5 animate-spin" /> Carregando produtos…
            </p>
          ) : error ? (
            <div role="alert" className="p-10 text-center">
              <p className="text-sm text-destructive">{error.message}</p>
              <button
                onClick={() => void refetch()}
                className="mt-4 rounded-xl border px-4 py-2 text-sm font-bold"
              >
                Tentar novamente
              </button>
            </div>
          ) : filtered.length ? (
            <ProductManagementList
              products={filtered}
              busy={busy}
              onEdit={setEditor}
              onDelete={setDeleting}
              onToggle={(p) =>
                void run(
                  () => api.setAvailability(p.id, p.active === false),
                  p.active === false
                    ? "Produto voltou ao estoque e aparece na loja."
                    : "Produto marcado sem estoque e ocultado da loja.",
                )
              }
            />
          ) : (
            <div className="p-14 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h2 className="mt-4 font-bold">
                {products.length
                  ? "Nenhum produto com esse filtro"
                  : "Seu primeiro produto começa aqui"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {products.length
                  ? "Tente outro nome ou selecione Todos."
                  : "Clique em Adicionar produto para começar seu catálogo."}
              </p>
            </div>
          )}
          <p className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">
            Marque “Sem estoque” para esconder um produto temporariamente. Use “Excluir” apenas
            quando quiser removê-lo definitivamente.
          </p>
        </section>
      </div>
      {editor && (
        <ProductEditor
          product={editor === "new" ? null : editor}
          onClose={() => setEditor(null)}
          onSave={async (form) => {
            if (editor === "new") await api.createProduct(form);
            else await api.updateProduct(editor.id, form);
            await refresh();
            setNotice(
              editor === "new"
                ? "Produto cadastrado com sucesso."
                : "Alterações salvas com sucesso.",
            );
            setEditor(null);
          }}
        />
      )}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto será removido definitivamente. Se ele apenas acabou, cancele e marque “Sem
              estoque”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Manter produto</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (deleting)
                  void run(async () => {
                    await api.deleteProduct(deleting.id);
                    setDeleting(null);
                  }, "Produto excluído definitivamente.");
              }}
            >
              {busy ? "Excluindo…" : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
          {failure && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
