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

  // Determine the rush class (next class after current)
  let rushClass = "eta"; // Default fallback
  try {
    const { data: currentClassData } = await supabase
      .from("requirements")
      .select("current_class")
      .single();

    const { data: classOrder } = await supabase
      .from("class_order")
      .select("class_name")
      .order("class_name");

    if (currentClassData?.current_class && classOrder) {
      const classNames = classOrder.map(c => c.class_name);
      const currentIndex = classNames.indexOf(currentClassData.current_class);
      // Rush class is the next class after current (or first if at end)
      if (currentIndex >= 0 && currentIndex < classNames.length - 1) {
        rushClass = classNames[currentIndex + 1];
      } else if (classNames.length > 0) {
        rushClass = classNames[0]; // Fallback to first class
      }
    }
  } catch (error) {
    console.error("Error determining rush class, using default:", error);
  }

  // Fetch rushees for current term
  const { data: rushees, error } = await supabase
    .from("rushees")
    .select("*")
    .eq("term_code", CURRENT_TERM);

  if (error) {
    console.error("Error fetching rushees:", error.message);
    return <p>Error loading rushees.</p>;
  }

  // Framework: User reactions and stars
  const userReactions = {};
  const userStars = new Set();

  return (
    <main className="m-4 flex flex-col gap-2">
      <span className="text-2xl font-bold tracking-tight leading-tight">Rush Directory</span>
      <p className="text-muted-foreground">Review any rushee.</p>

      <Suspense fallback={<p>Loading...</p>}>
        <ClientMembersView 
          rushees={rushees || []} 
          userReactions={userReactions}
          userStars={userStars}
        />
      </Suspense>
    </main>
  );
}
