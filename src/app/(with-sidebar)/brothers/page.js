import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientMembersView from "./ClientView";

export default async function MembersPage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/");

  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .eq("active", true);

  if (error) {
    console.error("Error fetching members:", error.message);
    return <p>Error loading members.</p>;
  }

  return (
    <main className="m-4 flex flex-col gap-2">
      <span className="text-2xl font-bold tracking-tight leading-tight">Brothers Directory</span>
      <p className="text-muted-foreground">Find any active member.</p>

      <Suspense fallback={<p>Loading...</p>}>
        <ClientMembersView members={members} />
      </Suspense>
    </main>
  );
}
