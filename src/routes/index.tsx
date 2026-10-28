import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { readDefaultSection } from "@/lib/section-cookie";

export const Route = createFileRoute("/")({
  loader: async () => ({ section: await readDefaultSection() }),
  component: IndexRoute,
});

function IndexRoute() {
  const data = Route.useLoaderData();
  return <Index initialSection={data?.section ?? undefined} />;
}
