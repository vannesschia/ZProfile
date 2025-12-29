import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientMembersView from "./ClientView";
import { CURRENT_TERM } from "../course-directory/term-functions";

export default async function RusheePage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/");

  const uniqname = session.user.email.split("@")[0];

  // Fetch rushees for current term (most recent term)
  const { data: rushees, error } = await supabase
    .from("rushees")
    .select("*");

  if (error) {
    console.error("Error fetching rushees:", error.message);
    return <p>Error loading rushees.</p>;
  }

  // Fetch user's reactions for all rushees
  const rusheeIds = rushees?.map(r => r.id) || [];
  let userReactions = {};
  let userStars = new Set();

  if (rusheeIds.length > 0) {
    // Fetch reactions
    const { data: reactions } = await supabase
      .from('rushee_reactions')
      .select('rushee_id, reaction_type')
      .eq('member_uniqname', uniqname)
      .in('rushee_id', rusheeIds);

    reactions?.forEach(r => {
      userReactions[r.rushee_id] = r.reaction_type;
    });
  }

  return (
    <main className="m-4 flex flex-col gap-2">
      <span className="text-2xl font-bold tracking-tight leading-tight">Rush Directory</span>
      <p className="text-muted-foreground">Review any rushee.</p>

      <Suspense fallback={<p>Loading...</p>}>
        <ClientMembersView rushees={rushees || []} 
          userReactions={userReactions}
          userStars={userStars}
        />
      </Suspense>
    </main>
  );
}
