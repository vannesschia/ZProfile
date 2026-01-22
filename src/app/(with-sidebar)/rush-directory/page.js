import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientMembersView from "./ClientView";
import { getRusheeComments, getRusheeNotes } from "./_lib/queries";

export default async function RusheePage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/");

  const email = session.user.email;

  const uniqname = email.split("@")[0];

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("admin")
    .eq("email_address", email)
    .single();

  if (memberError) {
    console.error("Error fetching member:", memberError.message);
    return <p>Error loading rushees.</p>;
  }

  // Explicitly check admin status - admins always have access, no exceptions
  const isAdmin = member?.admin === true;

  // Check if user has attended a rush event (required for access)
  // Admins always have access and bypass this check entirely
  if (!isAdmin) {
    const { data: rushEvents, error: rushEventsError } = await supabase
      .from('event_attendance')
      .select(`
        events!inner (
          event_type
        )
      `)
      .eq('uniqname', uniqname)
      .eq('events.event_type', 'rush_event')
      .limit(1);

    if (rushEventsError) {
      console.error("Error checking rush event attendance:", rushEventsError.message);
      return <p>Error loading rushees.</p>;
    }

    if (!rushEvents || rushEvents.length === 0) {
      return (
        <main className="m-4 flex flex-col gap-2">
          <span className="text-2xl font-bold tracking-tight leading-tight">Rush Directory</span>
          <p className="text-muted-foreground">You need to attend a rush event to access the rush directory.</p>
        </main>
      );
    }
  }

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

  // Parallelize all independent queries after rushees are fetched
  const [reactionsResult, starsResult, commentsResult, notesResult] = await Promise.all([
    // Fetch reactions (only if there are rushees)
    rusheeIds.length > 0
      ? supabase
          .from('rushee_reactions')
          .select('rushee_id, reaction_type')
          .eq('member_uniqname', uniqname)
          .in('rushee_id', rusheeIds)
      : Promise.resolve({ data: null }),
    
    // Fetch Stars (only if there are rushees)
    rusheeIds.length > 0
      ? supabase
          .from('rushee_stars')
          .select('rushee_id')
          .eq('member_uniqname', uniqname)
          .in('rushee_id', rusheeIds)
      : Promise.resolve({ data: null }),
    
    // Fetch comments
    getRusheeComments(rushees, uniqname, isAdmin).catch(error => {
      console.error("Error getting rushee comments:", error);
      return [];
    }),
    
    // Fetch notes
    getRusheeNotes().catch(error => {
      console.error("Error getting rushee notes:", error);
      return [];
    })
  ]);

  // Process reactions
  if (reactionsResult.data) {
    reactionsResult.data.forEach(r => {
      userReactions[r.rushee_id] = r.reaction_type;
    });
  }

  // Process stars
  if (starsResult.data) {
    starsResult.data.forEach(s => {
      userStars.add(s.rushee_id);
    });
  }

  const comments = commentsResult;
  const notes = notesResult;

  return (
    <main className="m-4 flex flex-col gap-2">
      <span className="text-2xl font-bold tracking-tight leading-tight">Rush Directory</span>
      <p className="text-muted-foreground">Review any rushee.</p>

      <Suspense fallback={<p>Loading...</p>}>
        <ClientMembersView
          rushees={rushees || []}
          comments={comments}
          notes={notes}
          uniqname={uniqname}
          isAdmin={isAdmin}
          userReactions={userReactions}
          userStars={userStars}
        />
      </Suspense>
    </main>
  );
}
