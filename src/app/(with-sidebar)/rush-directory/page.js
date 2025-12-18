import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientMembersView from "./ClientView";

export default async function RusheePage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/");

  const { data: rushees, error } = await supabase
    .from("rushees")
    .select("*");

  if (error) {
    console.error("Error fetching rushees:", error.message);
    return <p>Error loading rushees.</p>;
  }

  return (
    <main className="m-4 flex flex-col gap-2">
      <span className="text-2xl font-bold tracking-tight leading-tight">Rush Directory</span>
      <p className="text-muted-foreground">Review any rushee.</p>

      <Suspense fallback={<p>Loading...</p>}>
        <ClientMembersView rushees={rushees} />
      </Suspense>
    </main>
  );
}
