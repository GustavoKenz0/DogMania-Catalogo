import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin/AdminPage";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Dogmania Pet Shop" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { aba?: "agentes" } =>
    search.aba === "agentes" ? { aba: "agentes" } : {},
  component: AdminRoute,
});

function AdminRoute() {
  const { aba } = Route.useSearch();
  return <AdminPage showOffice={aba === "agentes"} />;
}
