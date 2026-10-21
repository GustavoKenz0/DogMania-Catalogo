import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSubcategories } from "@/features/products/taxonomy";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Home,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import logo from "@/assets/logo-dogmania-v2-original.png";
import { PetDrawing, type PetDrawingKind } from "@/components/PetDrawing";
import { WHATSAPP_NUMBER } from "@/config/store";
import type { CatalogCategory } from "@/features/products/model";

const categories: { value: CatalogCategory; label: string; drawing: PetDrawingKind }[] = [
  { value: "Todos", label: "Todos", drawing: "paw" },
  { value: "Cães", label: "Cachorro", drawing: "dog" },
  { value: "Gatos", label: "Gato", drawing: "cat" },
  { value: "Pássaros", label: "Pássaro", drawing: "bird" },
  { value: "Peixes", label: "Peixe", drawing: "fish" },
  { value: "Outros Pets", label: "Outros Pets", drawing: "rabbit" },
  { value: "Rações", label: "Rações", drawing: "bowl" },
  { value: "Higiene", label: "Higiene", drawing: "bath" },
  { value: "Brinquedos", label: "Brinquedos", drawing: "play" },
];

interface CatalogHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  activeCategory: CatalogCategory;
  onCategoryChange: (value: CatalogCategory) => void;
  onSearchSubmit?: () => void;
  activeSubcategory?: string;
}

export function CatalogHeader({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
  onSearchSubmit,
  activeSubcategory,
}: CatalogHeaderProps) {
  const [openCategory, setOpenCategory] = useState<CatalogCategory | null>(null);
  const [backdropTop, setBackdropTop] = useState(0);
  const [portalReady, setPortalReady] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const open = categories.find(({ value }) => value === openCategory);

  function cancelClose() {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }
  function closeMenu(restoreFocus = false) {
    cancelClose();
    setOpenCategory(null);
    if (restoreFocus) triggerRef.current?.focus();
  }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenCategory(null), 280);
  }
  function showMenu(category: CatalogCategory, trigger: HTMLButtonElement, focus = false) {
    cancelClose();
    if (!getSubcategories(category).length) {
      setOpenCategory(null);
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    const headerBottom = trigger.closest("header")?.getBoundingClientRect().bottom ?? rect.bottom;
    const top = Math.max(rect.bottom, headerBottom);
    setBackdropTop(Math.max(0, headerBottom));
    triggerRef.current = trigger;
    setMenuPosition({
      top,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      width,
      maxHeight: Math.max(120, window.innerHeight - top - 12),
    });
    setOpenCategory(category);
    if (focus) requestAnimationFrame(() => panelRef.current?.querySelector("a")?.focus());
  }
  function handleBlur(relatedTarget: EventTarget | null) {
    if (
      relatedTarget instanceof Node &&
      (navRef.current?.contains(relatedTarget) || panelRef.current?.contains(relatedTarget))
    )
      return;
    closeMenu();
  }

  useEffect(() => {
    setPortalReady(true);
    return () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!openCategory) return;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !navRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        setOpenCategory(null);
      }
    };
    const dismissOnMove = (event: Event) => {
      if (event.target instanceof Node && panelRef.current?.contains(event.target)) return;
      setOpenCategory(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        setOpenCategory(null);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", dismissOnEscape);
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", dismissOnMove);
    window.addEventListener("scroll", dismissOnMove, true);
    return () => {
      document.removeEventListener("keydown", dismissOnEscape);
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", dismissOnMove);
      window.removeEventListener("scroll", dismissOnMove, true);
    };
  }, [openCategory]);

  return (
    <>
      <header className="catalog-header">
        <div className="catalog-header-main mx-auto max-w-7xl px-4 sm:px-6">
          <Link to="/" className="catalog-header-brand" aria-label="Dogmania Pet Shop — início">
            <img src={logo} alt="Dogmania Pet Shop" width={1254} height={1254} />
          </Link>

          <form
            role="search"
            aria-label="Buscar no catálogo"
            className="catalog-header-search"
            onSubmit={(event) => {
              event.preventDefault();
              if (onSearchSubmit) {
                onSearchSubmit();
                return;
              }
              document.getElementById("catalog-results")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
                block: "start",
              });
            }}
          >
            <Search className="catalog-search-icon" size={22} aria-hidden="true" />
            <label htmlFor="catalog-search" className="sr-only">
              O que seu pet precisa?
            </label>
            <input
              id="catalog-search"
              type="search"
              placeholder="O que seu pet precisa?"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              autoComplete="off"
              aria-controls={onSearchSubmit ? undefined : "catalog-results"}
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="catalog-search-clear"
                aria-label="Limpar busca"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
            <button type="submit" className="catalog-search-submit" aria-label="Buscar produtos">
              <Search size={19} aria-hidden="true" />
            </button>
          </form>

          <div className="catalog-header-actions">
            <Link to="/" className="catalog-home-link" aria-label="Ir para o início">
              <Home size={21} aria-hidden="true" />
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="catalog-contact-link"
            >
              <span className="catalog-contact-icon">
                <MessageCircle size={22} aria-hidden="true" />
              </span>
              <span>
                <span className="catalog-contact-eyebrow">Precisa de ajuda?</span>
                <span className="catalog-contact-label">
                  Fale com a loja <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              </span>
            </a>
          </div>
        </div>

        <nav
          ref={navRef}
          aria-label="Categorias de produtos"
          className="catalog-category-nav"
          onBlur={(event) => handleBlur(event.relatedTarget)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && openCategory) {
              event.preventDefault();
              closeMenu(true);
            }
          }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="catalog-mobile-nav-label">
              <span>Encontre por categoria</span>
              <span>
                Deslize <ChevronRight size={13} aria-hidden="true" />
              </span>
            </div>
            <ul className="catalog-category-list">
              {categories.map(({ value, label, drawing }) => {
                const hasSubcategories = getSubcategories(value).length > 0;
                return (
                  <li key={value}>
                    <button
                      type="button"
                      className="catalog-category"
                      data-active={activeCategory === value}
                      data-has-subcategories={hasSubcategories}
                      data-menu-open={openCategory === value}
                      aria-pressed={activeCategory === value}
                      aria-expanded={hasSubcategories ? openCategory === value : undefined}
                      aria-controls={
                        hasSubcategories ? menuId : onSearchSubmit ? undefined : "catalog-results"
                      }
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse") showMenu(value, event.currentTarget);
                      }}
                      onPointerMove={(event) => {
                        if (event.pointerType === "mouse" && openCategory !== value) {
                          showMenu(value, event.currentTarget);
                        }
                      }}
                      onPointerLeave={(event) => {
                        if (event.pointerType === "mouse") scheduleClose();
                      }}
                      onClick={() => {
                        closeMenu();
                        onCategoryChange(value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown" && hasSubcategories) {
                          event.preventDefault();
                          showMenu(value, event.currentTarget, true);
                        }
                      }}
                    >
                      <span className="catalog-pet-avatar" aria-hidden="true">
                        <span className="catalog-pet-motion">
                          <PetDrawing kind={drawing} />
                        </span>
                      </span>
                      <span className="catalog-category-label">{label}</span>
                    </button>
                    {hasSubcategories && (
                      <button
                        type="button"
                        className="catalog-subcategory-toggle"
                        aria-label={`Abrir subcategorias de ${label}`}
                        aria-expanded={openCategory === value}
                        aria-controls={menuId}
                        onClick={(event) => {
                          if (openCategory === value) {
                            closeMenu();
                            return;
                          }
                          const categoryButton =
                            event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
                              ".catalog-category",
                            );
                          if (categoryButton) showMenu(value, categoryButton);
                        }}
                      >
                        <ChevronDown size={17} aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>
      {portalReady &&
        createPortal(
          <div
            className="catalog-subcategory-backdrop"
            data-open={Boolean(openCategory)}
            style={{ top: backdropTop }}
            aria-hidden="true"
          />,
          document.body,
        )}
      {open &&
        menuPosition &&
        createPortal(
          <div
            id={menuId}
            ref={panelRef}
            className="catalog-subcategory-panel"
            style={menuPosition}
            aria-label={`Subcategorias de ${open.label}`}
            onPointerEnter={cancelClose}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") scheduleClose();
            }}
            onBlur={(event) => handleBlur(event.relatedTarget)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeMenu(true);
              }
            }}
          >
            <ul className="catalog-subcategory-options">
              {getSubcategories(open.value).map(({ label }) => (
                <li key={label}>
                  <Link
                    to="/produtos"
                    search={{
                      busca: query.trim() || undefined,
                      categoria: open.value === "Todos" ? undefined : open.value,
                      subcategoria: label,
                    }}
                    hash="catalog-results"
                    className="catalog-subcategory-link"
                    aria-current={
                      activeCategory === open.value && activeSubcategory === label
                        ? "page"
                        : undefined
                    }
                    onClick={() => closeMenu()}
                  >
                    <span>{label}</span>
                    <ChevronRight size={17} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
