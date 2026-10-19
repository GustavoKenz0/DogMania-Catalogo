import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dogmania-painel")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
