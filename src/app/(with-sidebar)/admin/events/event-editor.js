'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"
import { useState } from "react"
import EditCommitteeEvent from "@/app/components/events/committee"
import EditChapterEvent from "@/app/components/events/chapter"
import EditPledgeEvent from "@/app/components/events/pledge-event"
import EditStudyTableEvent from "@/app/components/events/study-table"
import EditRushEvent from "@/app/components/events/rush-event"

export default function EventEditor({ mode, initialData = null, id = null }) {
  const [event, setEvent] = useState(initialData?.event_type ?? "");
  const events = [
    { name: "committee", label: "Committee", component: EditCommitteeEvent },
    { name: "chapter", label: "Chapter", component: EditChapterEvent },
    { name: "pledge_event", label: "Pledge Event", component: EditPledgeEvent },
    { name: "study_table", label: "Study Table", component: EditStudyTableEvent },
    { name: "rush_event", label: "Rush Event", component: EditRushEvent },
  ]

  const EventComponent = events.find(eve => eve.name === event)?.component;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col mt-8 mb-8 gap-1">
        <span className="font-flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 data-[error=true]:text-destructive mb-1">Event Type</span>
        <Select value={event} onValueChange={(value) => setEvent(value)}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Choose an event type" />
          </SelectTrigger>
          <SelectContent className="w-[300px] p-0">
            {events.map((event) => (
              <SelectItem
                key={event.name}
                value={event.name}
              >
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {EventComponent &&
        <EventComponent
          mode={mode}
          initialData={initialData}
          id={id}
        />
      }
    </div>
  )
}

export function CustomCommandItem({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props} />
  );
}