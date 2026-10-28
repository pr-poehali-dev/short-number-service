import { createFileRoute } from "@tanstack/react-router";
import AdminPage from "@/pages/AdminPage";

export const Route = createFileRoute("/admin-2407")({
  ssr: false,
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminPage,
});
