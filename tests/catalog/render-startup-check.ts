import assert from "node:assert/strict";

process.env.VITE_API_URL = "https://dogmania-test.onrender.com/api/v1";
const { api, ApiError } = await import("../../Dogmania-Catalogo/src/lib/api");

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};
Object.assign(globalThis, {
  window: { dispatchEvent() {} },
  sessionStorage: storage,
  localStorage: storage,
});

let now = 1;
Date.now = () => now;
globalThis.setTimeout = ((callback: () => void, delay = 0) => {
  now += delay;
  queueMicrotask(callback);
  return 0;
}) as typeof setTimeout;

type Call = { path: string; method: string; init?: RequestInit };
const calls: Call[] = [];
let respond: (call: Call) => Response;
globalThis.fetch = (async (input, init) => {
  const path = new URL(String(input)).pathname;
  const call = { path, method: init?.method ?? "GET", init };
  calls.push(call);
  return respond(call);
}) as typeof fetch;

const readyPath = "/health/ready";
const productsPath = "/api/v1/products";
const item = { id: "1", title: "Produto de teste", price: 10, active: true };
const product = { name: item.title, price: item.price, active: item.active };
const signIn = (token: string) => {
  storage.setItem("dogmania-auth-token", token);
  storage.setItem("dogmania-auth-expiry", String(now + 600_000));
};
const rejectedWith = (status: number, pattern?: RegExp) => (error: unknown) =>
  error instanceof ApiError && error.status === status && (!pattern || pattern.test(error.message));

respond = ({ path }) => {
  assert.equal(path, productsPath);
  return Response.json({ content: [item], last: true });
};
assert.equal((await api.fetchProducts())[0].name, item.title);
assert.deepEqual(
  calls.map(({ path }) => path),
  [productsPath],
);

calls.length = 0;
const readyAt = now + 128_000;
const attempts = new Map<string, number>();
respond = ({ path, init }) => {
  if (path === readyPath) {
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.cache, "no-store");
    assert.equal(init?.headers, undefined);
    if (now >= readyAt) return Response.json({ status: "UP" });
    now += 15_000;
    throw new TypeError("Network request timed out");
  }
  const attempt = (attempts.get(path) ?? 0) + 1;
  attempts.set(path, attempt);
  if (attempt === 1) {
    if (path !== productsPath) {
      return new Response("<p>Starting</p>", { headers: { "content-type": "text/html" } });
    }
    now += 15_000;
    throw new TypeError("Network request timed out");
  }
  assert.ok(now >= readyAt);
  return Response.json(path === productsPath ? { content: [item], last: true } : item);
};
const [list, detail] = await Promise.all([api.fetchProducts(), api.getProduct(item.id)]);
assert.equal(list[0].name, item.title);
assert.equal(detail.name, item.title);
assert.equal(attempts.get(productsPath), 2);
assert.equal(attempts.get(productsPath + "/" + item.id), 2);
const successfulProbe = calls.findLastIndex(({ path }) => path === readyPath);
assert.equal(calls.length - successfulProbe, 3);

calls.length = 0;
respond = ({ path }) => {
  assert.equal(path, productsPath + "/missing");
  return Response.json({ message: "Produto não encontrado" }, { status: 404 });
};
await assert.rejects(api.getProduct("missing"), rejectedWith(404));
assert.equal(calls.length, 1);

calls.length = 0;
now += 31_000;
signIn("first-session");
let probes = 0;
respond = ({ path, method, init }) => {
  if (path === readyPath) {
    probes++;
    if (probes === 1) {
      return new Response("<p>Starting</p>", { headers: { "content-type": "text/html" } });
    }
    if (probes === 2) return Response.json({ status: "DOWN" }, { status: 503 });
    return Response.json({ status: "UP" });
  }
  assert.equal(path, productsPath);
  assert.equal(method, "POST");
  assert.equal(init?.redirect, "error");
  assert.equal(new Headers(init?.headers).get("authorization"), "Bearer first-session");
  throw new TypeError("Response was lost after sending");
};
await assert.rejects(api.createProduct(product), rejectedWith(0, /confirme|confira/i));
assert.deepEqual(
  calls.map(({ method }) => method),
  ["GET", "GET", "GET", "POST"],
);
assert.equal(api.getToken(), "first-session");

calls.length = 0;
const waitingSince = now;
respond = ({ path }) => {
  assert.equal(path, readyPath);
  return Response.json({ status: "DOWN" }, { status: 503 });
};
await assert.rejects(api.createProduct(product), rejectedWith(503, /não foi enviada/));
assert.ok(calls.length > 1);
assert.equal(now - waitingSince, 160_000);

calls.length = 0;
respond = ({ path }) => {
  assert.equal(path, readyPath);
  signIn("new-session");
  return Response.json({ status: "UP" });
};
await assert.rejects(api.createProduct(product), rejectedWith(401));
assert.equal(api.getToken(), "new-session");
assert.equal(calls.length, 1);

calls.length = 0;
respond = ({ path }) => {
  assert.equal(path, "/api/v1/auth/me");
  return Response.json({ message: "Expired" }, { status: 401 });
};
await assert.rejects(api.me(), rejectedWith(401));
assert.equal(api.getToken(), null);
assert.equal(calls.length, 1);

calls.length = 0;
Reflect.deleteProperty(globalThis, "window");
respond = ({ path }) => {
  assert.equal(path, productsPath);
  throw new TypeError("SSR has no API connection");
};
await assert.rejects(api.fetchProducts(), rejectedWith(0));
assert.equal(calls.length, 1);

console.log(
  "Render startup: warm, 128-second recovery, shared checks, HTML/503, 404, writes, auth and SSR passed.",
);
