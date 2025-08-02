import { getServerClient } from "@/lib/supabaseServer";
import EventEditor from "../event-editor"

export const dynamic = "force-dynamic";

export default async function EditEventPage({ id }) {
  id="2ada9e9c-7486-412f-be0c-09090328db8b"
  if (!id) {
    console.error("Failed to get event ID");
    return;
  }

  const supabase = await getServerClient();

  const { data: initialData, error } = await supabase
    .from('events')
    .select(`
      name,
      event_type,
      committee,
      event_date,
      event_attendance (
        uniqname
      ),
      event_absences (
        uniqname,
        absence_type
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error("Failed to get initial data:", error.message);
    return;
  }

  return (
    <div className="m-4 flex flex-col gap-2">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">Edit Event</h2>
      <EventEditor mode={"edit"} initialData={initialData} id={id}/>
    </div>
  )
}