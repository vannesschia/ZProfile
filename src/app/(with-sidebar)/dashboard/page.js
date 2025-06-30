import { getServerClient } from "@/lib/supabaseServer";
import { AttendancePoints } from "@/app/components/attendance-points";
import { RequiredEvents } from "@/app/components/required-eventsv2";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser()

  const uniqname = user.email.split("@")[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-5">
      <div className="flex flex-col gap-5">
        <AttendancePoints uniqname={ uniqname }/>
        <RequiredEvents uniqname={ uniqname }/>
      </div>
    </div>
  );
}
