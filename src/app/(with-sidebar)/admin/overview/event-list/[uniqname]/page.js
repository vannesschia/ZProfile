import { getServerClient } from "@/lib/supabaseServer";
import { ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventListPage({ params }) {
  const { uniqname } = params;

  const supabase = await getServerClient();
  const { data: eventList, error } = await supabase
    .from('members')
    .select(`name,
      event_attendance (
        event_id
      ),
      event_absences (
        event_id,
        absence_type
      )
    `)
    .eq('uniqname', uniqname)
    .single()
  
  if (error) {
    console.error(error.message);
    return;
  }
  
  console.log(eventList)

  return (
    <div className="flex flex-col m-4">
      <div className="flex flex-row gap-1">
        Event Attendance for <span className="flex flex-row font-bold gap-1">{eventList.name}</span><ChevronDown />
      </div>
    </div>
  )
}