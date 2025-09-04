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
        <main className="min-h-screen px-1 py-1">
            <h1 className="text-3xl font-bold mb-2">Brothers Directory</h1>
            <p className="mb-6 text-muted-foreground">Find any active member.</p> 

            <Suspense fallback={<p>Loading...</p>}>
                <ClientMembersView members={members} />
            </Suspense>
        </main>
    );
}
