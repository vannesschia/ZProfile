import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import ArchivePage from "@/app/components/ArchivePage.jsx";


export const dynamic = "force-dynamic";

export default async function CoffeeChatPage() {
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

  const isAuthorized = member?.admin === true;
  
  if (!isAuthorized) {
    return (
      <div className="flex flex-col m-4 gap-4">
        <span className="text-2xl font-bold tracking-tight leading-tight">Access Denied</span>
        <p>This page is only accessible to admins.</p>
      </div>
    );
  }

  const { data: coffeeChats, error: fetchError } = await supabase
    .from("coffee_chats")
    .select(`
      id,
      pledge,
      brother,
      chat_date,
      image_proof,
      approval,
      pledge_member:members!coffee_chats_pledge_fkey(name),
      brother_member:members!coffee_chats_brother_fkey(name)
    `)
    .order("chat_date", { ascending: false });

  if (fetchError) {
    return (
      <main className="min-h-screen px-12 py-8">
        <h1 className="text-2xl font-bold mb-7">Error</h1>
        <p>Error loading coffee chat data: {fetchError.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-12 py-8">
      <h1 className="text-2xl font-bold mb-7">Coffee Chat Archive</h1>
      <ArchivePage initialData={coffeeChats || []} />
    </main>
  );
}