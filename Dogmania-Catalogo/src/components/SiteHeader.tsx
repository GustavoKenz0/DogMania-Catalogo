import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import logo from "@/assets/logo-dogmania-header-v2.png";

interface SiteHeaderProps {
  query?: string;
  onQueryChange?: (value: string) => void;
}

const inputClass =
  "w-full rounded-lg border-0 bg-primary-foreground py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export function SiteHeader({ query, onQueryChange }: SiteHeaderProps) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({
      to: "/produtos",
      search: { busca: term.trim() ? term.trim() : undefined },
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-6">
        <Link
          to="/"
          aria-label="Dogmania Pet Shop — início"
          className="flex h-14 w-28 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:h-16 sm:w-32"
        >
          <img
            src={logo}
            alt="Dogmania Pet Shop"
            width={1221}
            height={793}
            className="h-full w-full object-contain"
          />
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 sm:order-2 sm:w-auto">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-primary-foreground/15" }}
            className="rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-primary-foreground/10"
          >
            Início
          </Link>
          <Link
            to="/produtos"
            activeProps={{ className: "bg-primary-foreground/15" }}
            className="rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-primary-foreground/10"
          >
            Produtos
          </Link>
        </nav>

        <div className="order-2 w-full sm:order-3 sm:max-w-md sm:flex-1">
          {onQueryChange ? (
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query ?? ""}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Buscar produtos..."
                className={inputClass}
              />
            </label>
          ) : (
            <form className="relative block" role="search" onSubmit={submitSearch}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                aria-label="Buscar produtos"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className={inputClass}
              />
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
