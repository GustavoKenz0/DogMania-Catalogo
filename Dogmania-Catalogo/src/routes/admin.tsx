import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/admin/AdminPage";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Dogmania Pet Shop" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});
