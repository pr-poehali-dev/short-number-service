import { createFileRoute } from "@tanstack/react-router";
import IndexEn from "@/pages/IndexEn";

export const Route = createFileRoute("/en")({
  component: IndexEn,
});
