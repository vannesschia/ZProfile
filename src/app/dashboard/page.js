import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // const supabase = await getServerClient();
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();

  // if (!session) {
  //   redirect("/");
  // }

  // // Now we know `/callback` already inserted a members row if needed,
  // // so just fetch the data:
  // const email = session.user.email;
  // const { data: member, error } = await supabase
  //   .from("members")
  //   .select("*")
  //   .eq("email_address", email)
  //   .single();

  // if (error) {
  //   console.error("Failed to load member:", error);
  //   return (
  //     <main className="p-6">
  //       <h1>Error loading dashboard</h1>
  //     </main>
  //   );
  // }

  return (
    // <main className="p-6">
    //   <h1>Welcome, {member.name}!</h1>
    //   <p>Your email: {member.email_address}</p>
    //   <p>Your uniqname: {member.uniqname}</p>
    //   {/* …other dashboard UI… */}
    // </main>
    <div>
      <p> hello </p>
    </div>
  );
}
