import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { briefs } from "@/db/schema";
import { Nav } from "@/components/Nav";
import { briefToDTO } from "@/lib/dto";
import { DashboardClient } from "./DashboardClient";

export const metadata = { title: "Project management — Acme Bids" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/dashboard");

  const rows = await db.query.briefs.findMany({
    where: eq(briefs.userId, session.user.id),
    orderBy: [desc(briefs.createdAt)],
  });

  return (
    <div className="page-shell">
      <Nav current="dashboard" />
      <DashboardClient
        email={session.user.email ?? "you"}
        initialBriefs={rows.map(briefToDTO)}
      />
    </div>
  );
}
