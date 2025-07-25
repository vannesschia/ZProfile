import EventEditor from "../event-editor"

export const dynamic = "force-dynamic";

export default async function CreateEventPage() {
  return (
    <div className="m-4 flex flex-col gap-2">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">Create Event</h2>
      <EventEditor mode="create"/>
    </div>
  )
}