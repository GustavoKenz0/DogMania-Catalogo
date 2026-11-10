import type { OfficeSnapshot } from "@/features/admin/agent-office/model";
import type { Product } from "@/features/products/model";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1").replace(
  /\/$/,
  "",
);
const API_URL = URL.canParse(API_BASE) ? new URL(API_BASE) : null;
const RENDER_READY_URL =
  API_URL?.protocol === "https:" && API_URL.hostname.endsWith(".onrender.com")
    ? new URL("/health/ready", API_URL).href
    : null;
const REQUEST_TIMEOUT_MS = 15_000;
const RENDER_STARTUP_TIMEOUT_MS = 160_000;
const RENDER_PROBE_INTERVAL_MS = 4_000;
const RENDER_READY_VALID_MS = 30_000;
const RENDER_UNAVAILABLE = "O serviço não ficou disponível a tempo. Tente novamente.";
export const apiStartupNotice = RENDER_READY_URL
  ? "Se o serviço estiver iniciando, isso pode levar alguns minutos."
  : null;
let renderReadyUntil = 0;
let renderReadiness: Promise<boolean> | undefined;

const TOKEN_KEY = "dogmania-auth-token";
const EXPIRY_KEY = "dogmania-auth-expiry";
export const isAdminRole = (role: string) => role === "ADMIN" || role === "SUPER_ADMIN";
export type AdminUser = { userId: string; name: string; email: string; role: string };
export type AuthResponse = AdminUser & { token: string; tokenType: string; expiresIn: number };
type ProductDto = Omit<Product, "name"> & { title: string };
type ProductPage = { content: ProductDto[]; last: boolean };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function probeRenderReadiness(url: string) {
  const deadline = Date.now() + RENDER_STARTUP_TIMEOUT_MS;
  let remaining = deadline - Date.now();
  while (remaining > 0) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, remaining)),
      });
      const status = (await response.json().catch(() => null)) as { status?: string } | null;
      if (response.ok && status?.status === "UP") {
        renderReadyUntil = Date.now() + RENDER_READY_VALID_MS;
        return true;
      }
    } catch {
      // Render can return a loading page or close the connection while starting.
    }
    const delay = Math.min(RENDER_PROBE_INTERVAL_MS, deadline - Date.now());
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    remaining = deadline - Date.now();
  }
  return false;
}

function waitForRenderReadiness(url: string) {
  renderReadiness ??= probeRenderReadiness(url).finally(() => {
    renderReadiness = undefined;
  });
  return renderReadiness;
}

const isHtml = (response: Response) =>
  /^text\/html\b/i.test(response.headers.get("content-type") ?? "");

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const token = authenticated ? api.getToken() : null;
  if (authenticated && !token) {
    api.removeToken();
    throw new ApiError("Sua sessão terminou. Entre novamente.", 401);
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const read = !options.method || options.method === "GET" || options.method === "HEAD";
  const mutation = !read && path !== "/auth/login";
  const readinessUrl = typeof window !== "undefined" ? RENDER_READY_URL : null;
  const connectionError = (response?: Response | null) =>
    new ApiError(
      mutation
        ? "Não foi possível confirmar se a operação foi concluída. Confira os dados antes de tentar novamente."
        : "Não foi possível conectar ao sistema. Verifique a conexão e tente novamente.",
      response && !response.ok ? response.status : 0,
    );
  const send = () => {
    // A long readiness check may outlive the session that started the request.
    if (token && api.getToken() !== token) {
      throw new ApiError("Sua sessão terminou. Entre novamente.", 401);
    }
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      ...(read ? {} : { redirect: "error" }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    }).catch(() => null);
  };

  if (readinessUrl && !read && (renderReadiness || Date.now() >= renderReadyUntil)) {
    if (!(await waitForRenderReadiness(readinessUrl))) {
      throw new ApiError(
        "O serviço não ficou disponível a tempo. A solicitação não foi enviada.",
        503,
      );
    }
  }

  let response = await send();
  if (
    readinessUrl &&
    read &&
    (!response || [502, 503, 504].includes(response.status) || isHtml(response))
  ) {
    renderReadyUntil = 0;
    if (!(await waitForRenderReadiness(readinessUrl))) {
      throw new ApiError(RENDER_UNAVAILABLE, 503);
    }
    response = await send();
  }
  if (
    !response ||
    (readinessUrl && isHtml(response)) ||
    (mutation && [502, 504].includes(response.status))
  ) {
    renderReadyUntil = 0;
    throw connectionError(response);
  }
  if (!response.ok) {
    if (readinessUrl && [502, 503, 504].includes(response.status)) renderReadyUntil = 0;
    if (token && response.status === 401 && api.getToken() === token) api.removeToken();
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(
      response.status === 401
        ? "E-mail ou senha inválidos, ou sessão expirada."
        : error?.message ||
            (response.status === 503
              ? "Serviço temporariamente indisponível. Tente novamente em instantes."
              : "Não foi possível concluir a operação. Tente novamente."),
      response.status,
    );
  }
  try {
    const data = response.status === 204 ? undefined : await response.json();
    if (readinessUrl) renderReadyUntil = Date.now() + RENDER_READY_VALID_MS;
    return data as T;
  } catch {
    renderReadyUntil = 0;
    throw connectionError(response);
  }
}

const fromDto = (product: ProductDto): Product => ({
  ...product,
  name: product.title,
  price: Number(product.price),
  active: product.active !== false,
});
const toDto = ({ name, ...product }: Omit<Product, "id">) => ({ ...product, title: name });

export const api = {
  async uploadImage(file: File) {
    const body = new FormData();
    body.append("file", file);
    return request<{ url: string }>("/uploads/image", { method: "POST", body }, true);
  },
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    const expiry = Number(sessionStorage.getItem(EXPIRY_KEY));
    if (!expiry || Date.now() >= expiry) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return sessionStorage.getItem(TOKEN_KEY);
  },
  removeToken() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem("dogmania_token");
    localStorage.removeItem("dogmania-admin-session-v1");
    window.dispatchEvent(new Event("dogmania-auth-changed"));
  },
  async login(email: string, password: string) {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!isAdminRole(data.role))
      throw new ApiError("Este acesso é exclusivo para administradores.", 403);
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + data.expiresIn * 1000));
    return data;
  },
  me: () => request<AdminUser>("/auth/me", {}, true),
  fetchAgentOffice: () => request<OfficeSnapshot>("/admin/agent-office", {}, true),
  async fetchProducts(admin = false): Promise<Product[]> {
    const products: Product[] = [];
    let page = 0;
    let last = false;
    while (!last) {
      const data = await request<ProductPage>(
        `${admin ? "/admin" : ""}/products?size=100&page=${page}`,
        {},
        admin,
      );
      products.push(...data.content.map(fromDto));
      last = data.last || data.content.length === 0;
      page++;
    }
    return products;
  },
  async getProduct(id: string) {
    return fromDto(await request<ProductDto>(`/products/${encodeURIComponent(id)}`));
  },
  async createProduct(product: Omit<Product, "id">) {
    return fromDto(
      await request<ProductDto>(
        "/products",
        { method: "POST", body: JSON.stringify(toDto(product)) },
        true,
      ),
    );
  },
  async updateProduct(id: string, product: Omit<Product, "id">) {
    return fromDto(
      await request<ProductDto>(
        `/products/${encodeURIComponent(id)}`,
        { method: "PUT", body: JSON.stringify(toDto(product)) },
        true,
      ),
    );
  },
  setAvailability: (id: string, active: boolean) =>
    request<ProductDto>(
      `/products/${encodeURIComponent(id)}/availability`,
      { method: "PATCH", body: JSON.stringify({ active }) },
      true,
    ),
  deleteProduct: (id: string) =>
    request<void>(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }, true),
};
