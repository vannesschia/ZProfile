import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import CoffeeChatForm from "./CoffeeChatForm";

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

  // checks if admin or pledge role
  const isAuthorized = member?.admin === true || member?.role === "pledge";
  
  if (!isAuthorized) {
    return (
      <div className="flex flex-col m-4 gap-4">
        <span className="text-2xl font-bold tracking-tight leading-tight">Access Denied</span>
        <p>This page is only accessible to pledges.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col m-4 gap-4">
      <span className="text-2xl font-bold tracking-tight leading-tight">Coffee Chat Form</span>
      <CoffeeChatForm />
    </div>
  );
}