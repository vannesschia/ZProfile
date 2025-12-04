"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command as CommandPrimitive } from "cmdk";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { startTransition, useEffect, useRef, useState } from "react";
import EditCommitteeEvent from "./committee";
import EditChapterEvent from "./chapter";
import EditPledgeEvent from "./pledge-event";
import EditStudyTableEvent from "./study-table";
import EditRushEvent from "./rush-event";
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, ChevronDown, Loader2Icon, Plus, TrashIcon, CircleX, CircleCheck } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteEvent } from "../_lib/actions";

export default function EventEditor({ mode, initialData = null, members, id = null }) {
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
          members={members}
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
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("data-active-item");
    el.scrollIntoView = () => {};
  }, []);
  
  return (
    <CommandPrimitive.Item
      ref={ref}
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
  availableTitle = "Available Names",
  selectedTitle = "Selected Names",
}) {
  const move = (person) => {
    const isSelected = availablePeople.includes(person);
    const newAvailablePeople = (isSelected
      ? availablePeople.filter(mem => mem !== person)
      : [...availablePeople, person]).sort((a, b) => { return a.name.localeCompare(b.name) });
    setAvailablePeople(newAvailablePeople);
    const newSelectedPeople = (isSelected
      ? [...selectedPeople, person]
      : selectedPeople.filter(mem => mem !== person)).sort((a, b) => { return a.name.localeCompare(b.name) });
    setSelectedPeople(newSelectedPeople);
    form.setValue(formItem, newSelectedPeople.map(mem => mem.uniqname), {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  const moveAll = () => {
    if (selectedPeople.length === allPeople.length) {
      setAvailablePeople(allPeople.sort((a, b) => { return a.name.localeCompare(b.name) }));
      setSelectedPeople([]);
      form.setValue(formItem, [], {
        shouldValidate: false,
        shouldDirty: true,
      });
    } else {
      setAvailablePeople([]);
      setSelectedPeople(allPeople.sort((a, b) => { return a.name.localeCompare(b.name) }));
      form.setValue(formItem, allPeople.sort((a, b) => { return a.name.localeCompare(b.name) }).map(mem => mem.uniqname), {
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
            {availablePeople.map((person) => {
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
                          className={`mr-4 ${person.status !== "not_ready"
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
            })}
          </CommandList>
        </Command>
      </div>
      <div className="flex flex-col w-full">
        <span className="text-[12px] text-muted-foreground select-none mb-1">{selectedTitle}</span>
        <Command className="min-h-[36px] rounded-md border">
          <CommandList className="max-h-[332px]">
            {selectedPeople.map((person) => {
              return (
                <CustomCommandItem
                  key={person.uniqname}
                  onSelect={() => move(person)}
                >
                  <div className="flex flex-row items-center justify-between w-full">
                    <div className="flex flex-row items-center gap-2">
                      <TrashIcon className="w-4 h-4" />
                      {person.name}
                    </div>
                    <div>
                      {person.status && (
                        <Badge
                          className={`mr-4 ${person.status !== "not_ready"
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
            })}
          </CommandList>
        </Command>
      </div>
    </div>
  )
}

export function DeleteEventButton({ id }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDelete() {
    try {
      setIsDeleting(true);
      await deleteEvent(id);

      toast.success("Event deleted successfully!");

      startTransition(() => {
        router.replace("/admin/dashboard?tab=events");
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete event.");
    } finally {
      setIsDeleting(false);
    }
  }

  const handleOpenChange = (newOpenState) => {
    if (!isDeleting) {
      setOpen(newOpenState);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
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
          <AlertDialogCancel
            disabled={isDeleting}
            className="cursor-pointer"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            disabled={isDeleting}
            variant="destructive"
            className="cursor-pointer"
            onClick={onDelete}
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="animate-spin" />
                Deleting
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}