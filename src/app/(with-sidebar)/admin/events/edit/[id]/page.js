import EventEditor from "../../_components/event-editor";
import { getMembers } from "../../_lib/queries";
import { getEventData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }) {
  const { id } = await params;

  if (!id) {
    console.error("Failed to get event ID.");
    return (
      <span>Failed to get event ID.</span>
    )
  }

  let initialData, members;

  try {
    initialData = await getEventData(id);
    members = await getMembers();
  } catch (error) {
    console.error(error);
    return (
      <span>Failed to get initial data for event.</span>
    )
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">Edit Event</h2>
      <EventEditor mode={"edit"} initialData={initialData} members={members} id={id}/>
    </div>
  )
}