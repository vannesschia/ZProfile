import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import CoffeeChatApprovalClient from "./CoffeeChatApprovalClient";

export const dynamic = "force-dynamic";

export default async function CoffeeChatApprovalPage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const email = session.user.email;
  const { data: member, error } = await supabase
    .from("members")
    .select("admin, role")
    .eq("email_address", email)
    .single();

  if (error && error.code !== "PGRST116") {
    return (
      <main className="min-h-screen px-12 py-8">
        <h1 className="text-2xl font-bold mb-7">Error</h1>
        <p>Error loading member data: {error.message}</p>
      </main>
    );
  }

  // Fetch pending coffee chats with member names
  const { data: coffeeChatData, error: fetchError } = await supabase
    .from("coffee_chats")
    .select(`
      id,
      pledge,
      brother,
      image_proof,
      chat_date,
      approval,
      pledge_member:members!coffee_chats_pledge_fkey(name),
      brother_member:members!coffee_chats_brother_fkey(name)
    `)
    .eq("approval", "pending")
    .order("chat_date", { ascending: false });

  if (fetchError) {
    console.error("Error fetching coffee chats:", fetchError);
    return (
      <main className="min-h-screen px-12 py-8">
        <h1 className="text-2xl font-bold mb-7">Error</h1>
        <p>Error loading coffee chat data: {fetchError.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-12 py-8">
      <h1 className="text-2xl font-bold mb-7">Coffee Chat Approval</h1>
      <p className="mb-6 text-muted-foreground">
      </p>
      
      <CoffeeChatApprovalClient initialData={coffeeChatData || []} />
    </main>
  );
}
