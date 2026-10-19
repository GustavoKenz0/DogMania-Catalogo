import type { Product } from "@/features/products/model";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1").replace(
  /\/$/,
  "",
);
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

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (authenticated) {
    const token = api.getToken();
    if (!token) {
      api.removeToken();
      throw new ApiError("Sua sessão terminou. Entre novamente.", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao sistema. Verifique a conexão e tente novamente.",
      0,
    );
  }
  if (!response.ok) {
    if (authenticated && response.status === 401) api.removeToken();
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(
      response.status === 401
        ? "E-mail ou senha inválidos, ou sessão expirada."
        : error?.message || "Não foi possível concluir a operação. Tente novamente.",
      response.status,
    );
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
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
