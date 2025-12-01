import EventEditor from "../_components/event-editor";
import { getMembers } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function CreateEventPage() {
  let members;

  try {
    members = await getMembers();
  } catch (error) {
    console.error(error);
    return (
      <span>Failed to get initial data for event.</span>
    )
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">Create Event</h2>
      <EventEditor mode="create" members={members} />
    </div>
  )
}