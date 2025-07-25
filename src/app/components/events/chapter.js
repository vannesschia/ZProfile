'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { CheckIcon, ChevronDown, Loader2Icon } from "lucide-react"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomCommandItem } from "@/app/(with-sidebar)/admin/events/event-editor";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { getMembers } from "./members-data";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required"}),
  unexcused_absences: z.array(z.string().min(1)),
  excused_absences: z.array(z.string().min(1)),
});

export default function EditChapterEvent({ mode, initialData, id }) {
  if (mode === "edit" && !id) {
    return;
  }
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [selectedUnexcusedAbsence, setSelectedUnexcusedAbsence] = useState([]);
  const [selectedExcusedAbsence, setSelectedExcusedAbsence] = useState([]);

  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      event_date: initialData?.event_date ? (() => {
        const [year, month, day] = initialData.event_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
      unexcused_absences: initialData?.event_absences.filter((absence) => absence.absence_type === "unexcused").map(absence => absence.uniqname) ?? [],
      excused_absences: initialData?.event_absences.filter((absence) => absence.absence_type === "excused").map(absence => absence.uniqname) ?? [],
    },
  });

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
    })
    setSelectedUnexcusedAbsence(form.getValues("unexcused_absences"));
    setSelectedExcusedAbsence(form.getValues("excused_absences"));
  }, [])

  const toggleUnexcusedAbsence = (member) => {
    const newSelectedUnexcusedAbsence = selectedUnexcusedAbsence.includes(member)
      ? selectedUnexcusedAbsence.filter((mem) => mem !== member)
      : [...selectedUnexcusedAbsence, member];
    setSelectedUnexcusedAbsence(newSelectedUnexcusedAbsence);
    form.setValue(`unexcused_absences`, newSelectedUnexcusedAbsence, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  const toggleExcusedAbsence = (member) => {
    const newSelectedExcusedAbsence = selectedExcusedAbsence.includes(member)
      ? selectedExcusedAbsence.filter((mem) => mem !== member)
      : [...selectedExcusedAbsence, member];
    setSelectedExcusedAbsence(newSelectedExcusedAbsence);
    form.setValue(`excused_absences`, newSelectedExcusedAbsence, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  async function onSubmit(values) {
    const { name, event_date, unexcused_absences, excused_absences } = values;

    const supabase = createClientComponentClient();

    if (mode === "edit") {

      const payload = {
        name,
        event_type: "chapter",
        event_date,
      };

      const { error: eventsError } = await supabase
        .from('events')
        .update(payload)
        .eq('id', id)

      if (eventsError) {
        console.error("Failed to update event:", eventsError.message);
        toast.error("Failed to update event.");
        return;
      }

      const { error: eventAbsencesDeleteError } = await supabase
        .from('event_absences')
        .delete()
        .eq('event_id', id)

      if (eventAbsencesDeleteError) {
        console.error("Failed to update event:", eventAbsencesDeleteError.message);
        toast.error("Failed to update event.");
        return;
      }

      const absences = [
        ...unexcused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "unexcused" })),
        ...excused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "excused" })),
      ];

      const { error: eventAbsencesUpdateError } = await supabase
        .from('event_absences')
        .insert(absences)
      
      if (eventAbsencesUpdateError) {
        console.error("Failed to update event:", eventAbsencesUpdateError.message);
        toast.error("Failed to update event.");
        return;
      }

      toast.success("Event saved successfully!");
      console.log("Event saved successfully!");
    } else {

      const id = crypto.randomUUID();

      const payload = {
        id,
        name,
        event_type: "chapter",
        event_date,
      };

      const { error: eventsError } = await supabase
        .from('events')
        .insert(payload)

      if (eventsError) {
        console.error("Failed to create event:", eventsError.message);
        toast.error("Failed to create event.");
        return;
      }

      const absences = [
        ...unexcused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "unexcused" })),
        ...excused_absences.map(x => ({ event_id: id, uniqname: x, absence_type: "excused" })),
      ];

      const { error: eventAbsencesUpdateError } = await supabase
        .from('event_absences')
        .insert(absences)
      
      if (eventAbsencesUpdateError) {
        console.error("Failed to create event:", eventAbsencesUpdateError.message);
        toast.error("Failed to create event.");
        return;
      }

      toast.success("Event created successfully!");
      console.log("Event created successfully!");
    }
    setTimeout(() => {
      router.push("/admin/events");
    }, 1000);
  }

  async function onDelete() {
    const supabase = createClientComponentClient();

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Failed to delete event:", error.message);
      toast.error("Failed to delete event.");
      return;
    }
    
    toast.success("Event deleted successfully!");
    console.log("Event deleted successfully!");

    setTimeout(() => {
      router.push("/admin/events");
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-16">
            <FormLabel className="w-[200px]">Date</FormLabel>
            {form.getValues("event_date") && <FormLabel>Name</FormLabel>}
          </div>
          <div className="flex flex-row gap-16 mb-8">
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormControl>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-between"
                          type="button"
                        >
                          {field.value
                            ? field.value.toLocaleDateString()
                            : "Select date"}
                          <ChevronDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            form.setValue("event_date", date);
                            setDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage className="flex-grow"/>
                </FormItem>
              )}
            />
            {form.getValues("event_date") &&
              (() => {
                const date = new Date(form.getValues("event_date"));
                const month = date.toLocaleString("default", { month: "long" });
                form.setValue("name", `${month} Chapter`);
                return (
                  <span 
                    className="w-[300px] items-center border-input flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive">
                    {month} Chapter
                  </span>
                )
              })()
            }
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <FormLabel>Unexcused Absences</FormLabel>
              <FormField
                control={form.control}
                name="unexcused_absences"
                render={({ field }) => (
                  <FormItem className="w-[564px]">
                    <FormControl>
                      <Command className="border shadow-xs">
                        <div className="relative flex flex-row gap-1 justify-between">
                          <CommandInput
                            className="w-[564px] pr-36"
                            placeholder="Search member's name"
                          />
                        </div>
                        <CommandList>
                          {membersData.map((member) => {
                            const isSelected = selectedUnexcusedAbsence.includes(member.uniqname);
                            const toNotSelect = selectedExcusedAbsence.includes(member.uniqname);
                            return (
                              <CustomCommandItem
                                disabled={toNotSelect}
                                key={member.uniqname}
                                onSelect={() => toggleUnexcusedAbsence(member.uniqname)}
                                className="cursor-pointer hover:bg-gray-100"
                              >
                                <div className={`flex h-4 w-4 border items-center justify-center
                                  ${isSelected ? "border-green-500" : "opacity-50 [&_svg]:invisible"}
                                `}>
                                  <CheckIcon size="icon" className={`${isSelected ? "text-green-500" : "text-primary"}`}/>
                                </div>
                                {member.name}
                              </CustomCommandItem>
                            )
                          })}
                        </CommandList>
                      </Command>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FormLabel>Excused Absences</FormLabel>
              <FormField
                control={form.control}
                name="excused_absences"
                render={({ field }) => (
                  <FormItem className="mb-8 w-[564px]">
                    <FormControl>
                      <Command className="border shadow-xs">
                        <div className="relative flex flex-row gap-1 justify-between">
                          <CommandInput
                            className="w-[564px] pr-36"
                            placeholder="Search member's name"
                          />
                        </div>
                        <CommandList>
                          {membersData.map((member) => {
                            const isSelected = selectedExcusedAbsence.includes(member.uniqname);
                            const toNotSelect = selectedUnexcusedAbsence.includes(member.uniqname);
                            return (
                              <CustomCommandItem
                                disabled={toNotSelect}
                                key={member.uniqname}
                                onSelect={() => toggleExcusedAbsence(member.uniqname)}
                                className="cursor-pointer hover:bg-gray-100"
                              >
                                <div className={`flex h-4 w-4 border items-center justify-center
                                  ${isSelected ? "border-green-500" : "opacity-50 [&_svg]:invisible"}
                                `}>
                                  <CheckIcon size="icon" className={`${isSelected ? "text-green-500" : "text-primary"}`}/>
                                </div>
                                {member.name}
                              </CustomCommandItem>
                            )
                          })}
                        </CommandList>
                      </Command>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="w-[564px] flex flex-row gap-4 justify-between">
            {mode === "edit"
              ? form.formState.isSubmitting
                ? <Button disabled className="w-[100px]">
                    <Loader2Icon className="animate-spin" />
                    Saving
                  </Button>
                : <Button className="cursor-pointer" type="submit">Save</Button>
              : form.formState.isSubmitting
                ?
                  <Button disabled className="w-[100px]">
                    <Loader2Icon className="animate-spin" />
                    Creating
                  </Button>
                :
                  <Button
                    className="cursor-pointer"
                    type="submit"
                  >
                    Create
                  </Button>
            }
            {mode === "edit" &&
              <AlertDialog>
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
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => onDelete()}
                      >
                        Delete
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            }
          </div>
        </div>
      </form>
    </Form>
  )
}