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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command as CommandPrimitive } from "cmdk"
import { capitalizeFirstLetter, cn } from "@/lib/utils"
import { useState } from "react"
import EditCommitteeEvent from "@/app/components/events/committee"
import EditChapterEvent from "@/app/components/events/chapter"
import EditPledgeEvent from "@/app/components/events/pledge-event"
import EditStudyTableEvent from "@/app/components/events/study-table"
import EditRushEvent from "@/app/components/events/rush-event"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, ChevronDown, Loader2Icon, Plus, TrashIcon, CircleX, CircleCheck } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

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
    <div className="flex flex-col gap-4 w-full lg:w-[564px]">
      <div className="flex flex-col mb-8 gap-2">
        <span className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">Event Type</span>
        <Select value={event} onValueChange={(value) => setEvent(value)}>
          <SelectTrigger disabled={mode === "edit"} className="cursor-pointer w-full lg:w-[calc(50%-16px)]">
            <SelectValue placeholder="Select an event type" />
          </SelectTrigger>
          <SelectContent className="box-border p-0">
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
  disabled,
  onSelect,
  ...props
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      onSelect={(value) => {
        if (disabled) return;
        onSelect?.(value);
      }}
      className={cn(
        "cursor-pointer relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
        {
          "opacity-50 cursor-not-allowed": disabled,
          "hover:bg-secondary": !disabled,
        },
        className
      )}
      {...props}
    />
  );
}

export function SelectDate({
  value,
  dateOpen,
  setDateOpen,
  form,
  formItem,
}) {
  return (
    <Popover open={dateOpen} onOpenChange={setDateOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`${value ? "text-popover-foreground" : "text-muted-foreground"} cursor-pointer font-normal w-full justify-between`}
          type="button"
        >
          {value
            ? value.toLocaleDateString()
            : "Select a date"}
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          onSelect={(date) => {
            form.setValue(formItem, date);
            setDateOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export function AttendanceDualListbox({
  enableMoveAll,
  allPeople,
  availablePeople,
  setAvailablePeople,
  selectedPeople,
  setSelectedPeople,
  disable,
  form,
  formItem,
  loading,
  availableTitle = "Available Names",
  selectedTitle = "Selected Names",
}) {

  const move = (person) => {
    const isSelected = availablePeople.includes(person);
    const newAvailablePeople = (isSelected
      ? availablePeople.filter(mem => mem !== person)
      : [...availablePeople, person]).sort((a, b) => {return a.name.localeCompare(b.name)});
    setAvailablePeople(newAvailablePeople);
    const newSelectedPeople = (isSelected
      ? [...selectedPeople, person]
      : selectedPeople.filter(mem => mem !== person)).sort((a, b) => {return a.name.localeCompare(b.name)});
    setSelectedPeople(newSelectedPeople);
    form.setValue(formItem, newSelectedPeople.map(mem => mem.uniqname), {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  const moveAll = () => {
    if (selectedPeople.length === allPeople.length) {
      setAvailablePeople(allPeople.sort((a, b) => {return a.name.localeCompare(b.name)}));
      setSelectedPeople([]);
      form.setValue(formItem, [], {
        shouldValidate: false,
        shouldDirty: true,
      });
    } else {
      setAvailablePeople([]);
      setSelectedPeople(allPeople.sort((a, b) => {return a.name.localeCompare(b.name)}));
      form.setValue(formItem, allPeople.sort((a, b) => {return a.name.localeCompare(b.name)}).map(mem => mem.uniqname), {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2 sm:gap-8">
      <div className="flex flex-col w-full">
        <span className="text-[12px] text-muted-foreground select-none mb-1">{availableTitle}</span>
        <Command className="border shadow-xs">
          <div className="relative flex flex-row gap-1 justify-between">
            <CommandInput
              className={`${enableMoveAll ? "pr-24" : ""}`}
              placeholder="Search by name"
            />
            {enableMoveAll &&
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="cursor-pointer size-fit p-1 absolute top-1/2 -translate-y-1/2 right-1.5 opacity-50"
                onClick={moveAll}
              >
                <ArrowLeftRight />Move all
              </Button>
            }
          </div>
          <CommandList>
            {loading
              ? <div className="p-2 flex flex-col gap-4">
                  <div className="flex flex-row gap-2">
                    <Skeleton className="w-4 h-4 rounded-[4px]"/>
                    <Skeleton className="w-[150px] rounded-[4px]" />
                  </div>
                  <div className="flex flex-row gap-2">
                    <Skeleton className="w-4 h-4 rounded-[4px]"/>
                    <Skeleton className="w-[200px] rounded-[4px]" />
                  </div>
                  <div className="flex flex-row gap-2">
                    <Skeleton className="w-4 h-4 rounded-[4px]"/>
                    <Skeleton className="w-[100px] rounded-[4px]" />
                  </div>
                </div>
              : (availablePeople.map((person) => {
                  return (
                    <CustomCommandItem
                      disabled={disable?.includes(person)}
                      key={person.uniqname}
                      onSelect={() => move(person)}
                    >
                      <div className="flex flex-row items-center justify-between w-full">
                        <div className="flex flex-row items-center gap-2">
                          <Plus className="w-4 h-4" />
                          {person.name}
                        </div>
                        <div>
                          {person.status && (
                            <Badge
                              className={`mr-4 ${
                                person.status !== "not_ready"
                                  ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                                  : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                              }`}
                            >
                              {person.status === "ready" ? (
                                <CircleCheck className="w-4 h-4 text-green-700 dark:text-green-200 inline-block" />
                              ) : (
                                <CircleX className="w-4 h-4 text-red-700 dark:text-red-200 inline-block" />
                              )}
                              {capitalizeFirstLetter(person.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CustomCommandItem>
                  );
                }))
            }
          </CommandList>
        </Command>
      </div>
      <div className="flex flex-col w-full">
        <span className="text-[12px] text-muted-foreground select-none mb-1">{selectedTitle}</span>
        <Command className="min-h-[36px] rounded-md border">
          <CommandList className="max-h-[332px]">
            {loading
              ? <div className="p-2 flex flex-col gap-4">
                  <div className="flex flex-row gap-2">
                    <Skeleton className="w-4 h-4 rounded-[4px]"/>
                    <Skeleton className="w-[150px] rounded-[4px]" />
                  </div>
                  <div className="flex flex-row gap-2">
                    <Skeleton className="w-4 h-4 rounded-[4px]"/>
                    <Skeleton className="w-[200px] rounded-[4px]" />
                  </div>
                  <div className="flex flex-row gap-2">
                    <Skeleton className="w-4 h-4 rounded-[4px]"/>
                    <Skeleton className="w-[100px] rounded-[4px]" />
                  </div>
                  <div className="flex flex-row gap-2">
                    <Skeleton className="w-4 h-4 rounded-[4px]"/>
                    <Skeleton className="w-[75px] rounded-[4px]" />
                  </div>
                </div>
              : (selectedPeople.map((person) => {
                  return (
                    <CustomCommandItem
                      key={person.uniqname}
                      onSelect={() => move(person)}
                    >
                      <div className="flex flex-row items-center justify-between w-full">
                        <div className="flex flex-row items-center gap-2">
                          <TrashIcon className="w-4 h-4"/>
                          {person.name}
                        </div>
                        <div>
                          {person.status && (
                            <Badge
                              className={`mr-4 ${
                                person.status !== "not_ready"
                                  ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                                  : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                              }`}
                            >
                              {person.status === "ready" ? (
                                <CircleCheck className="w-4 h-4 text-green-700 dark:text-green-200 inline-block" />
                              ) : (
                                <CircleX className="w-4 h-4 text-red-700 dark:text-red-200 inline-block" />
                              )}
                              {capitalizeFirstLetter(person.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CustomCommandItem>
                  )
                }))
            }
          </CommandList>
        </Command>
      </div>
    </div>
  )
}

export async function SubmitEdit({ event_type, values, id, router }) {
  const { name, event_date, committee, attendance, unexcused_absences, excused_absences } = values;

  const supabase = createClientComponentClient();

  const payload = Object.fromEntries(
    Object.entries({ name, event_date, event_type, committee, })
    .filter(value => value !== null)
  );
  
  const { error: eventsError } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)

  if (eventsError) {
    console.error(`Failed to update payload for event with ID ${id}:`, eventsError.message);
    toast.error("Failed to update event.");
    return;
  }

  if (attendance) {
    const { error: eventAttendanceDeleteError } = await supabase
      .from('event_attendance')
      .delete()
      .eq('event_id', id)

    if (eventAttendanceDeleteError) {
      console.error(`Failed to delete attendance for event with ID ${id}:`, eventAttendanceDeleteError.message);
      toast.error("Failed to update event.");
      return;
    }

    const { error: eventAttendanceInsertError } = await supabase
      .from('event_attendance')
      .insert(attendance.map(mem => ({ event_id: id, uniqname: mem })))
    
    if (eventAttendanceInsertError) {
      console.error(`Failed to insert attendance for event with ID ${id}:`, eventAttendanceInsertError.message);
      toast.error("Failed to update event.");
      return;
    }
  }

  if (unexcused_absences) {
    const { error: eventAbsencesDeleteError } = await supabase
      .from('event_absences')
      .delete()
      .eq('event_id', id)

    if (eventAbsencesDeleteError) {
      console.error(`Failed to delete absences for event with ID ${id}:`, eventAbsencesDeleteError.message);
      toast.error("Failed to update event.");
      return;
    }

    const absences = [
      ...unexcused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "unexcused" })),
      ...excused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "excused" })),
    ];

    const { error: eventAbsencesInsertError } = await supabase
      .from('event_absences')
      .insert(absences)
    
    if (eventAbsencesInsertError) {
      console.error(`Failed to insert absences for event with ID ${id}:`, eventAbsencesInsertError.message);
      toast.error("Failed to update event.");
      return;
    }
  }

  toast.success("Event saved successfully!");

  setTimeout(() => {
    router.push("/admin/dashboard?tab=events");
  }, 1000);
}

export async function SubmitCreate({ event_type, values, router }) {
  const { name, event_date, committee, attendance, unexcused_absences, excused_absences } = values;

  const supabase = createClientComponentClient();

  const id = crypto.randomUUID();

  const payload = Object.fromEntries(
    Object.entries({ id, name, event_date, event_type, committee, })
    .filter(value => value !== null)
  );

  const { error: eventsError } = await supabase
    .from('events')
    .insert(payload)

  if (eventsError) {
    console.error(`Failed to insert payload:`, eventsError.message);
    toast.error("Failed to create event.");
    return;
  }

  if (attendance) {
    const { error: eventAttendanceInsertError } = await supabase
      .from('event_attendance')
      .insert(attendance.map(mem => ({ event_id: id, uniqname: mem })))
    
    if (eventAttendanceInsertError) {
      console.error(`Failed to insert attendance:`, eventAttendanceInsertError.message);
      toast.error("Failed to create event.");
      return;
    }
  }

  if (unexcused_absences) {
    const absences = [
      ...unexcused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "unexcused" })),
      ...excused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "excused" })),
    ];

    const { error: eventAbsencesInsertError } = await supabase
      .from('event_absences')
      .insert(absences)
    
    if (eventAbsencesInsertError) {
      console.error("Failed to insert absences:", eventAbsencesInsertError.message);
      toast.error("Failed to create event.");
      return;
    }
  }

  toast.success("Event created successfully!");

  setTimeout(() => {
    router.push("/admin/dashboard?tab=events");
  }, 1000);
}

export async function DeleteEvent({ id, router }) {
  const supabase = createClientComponentClient();

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(`Failed to delete event with ID ${id}:`, error.message);
    toast.error("Failed to delete event.");
    return;
  }
  
  toast.success("Event deleted successfully!");

  setTimeout(() => {
    router.push("/admin/dashboard?tab=events");
  }, 1000);
}

export function SaveEventButton({ submitting }) {
  return (
    <Button className="cursor-pointer w-[80px]" type="submit" disabled={submitting}>
      {submitting ? <Loader2Icon className="animate-spin" /> : "Save"}
    </Button>
  )
}

export function CreateEventButton({ submitting }) {
  return (
    <Button className="cursor-pointer w-[80px]" type="submit" disabled={submitting}>
      {submitting ? <Loader2Icon className="animate-spin" /> : "Create"}
    </Button>
  )
}

export function DeleteEventButton({ submitting, onDelete }) {
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    if (!open) {
      setOpen(true);
    }
    else if (!submitting) {
      setOpen(false);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="cursor-pointer w-[100px]"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {submitting
            ? <>
                <AlertDialogCancel
                  disabled
                  className="cursor-pointer"
                >
                  Cancel
                </AlertDialogCancel>
                <Button
                  disabled
                  variant="destructive"
                  onClick={onDelete}
                >
                  <Loader2Icon className="animate-spin" />
                  Deleting
                </Button>
              </>
            : <>
                <AlertDialogCancel
                  className="cursor-pointer"
                >
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={onDelete}
                >
                  Delete
                </Button>
              </>
          }
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}