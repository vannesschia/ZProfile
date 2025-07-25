'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { Calendar } from "@/components/ui/calendar"
import { CheckIcon, ChevronDown, Layers2, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CustomCommandItem } from "@/app/(with-sidebar)/admin/events/event-editor";
import { toast } from "sonner";
import { getMembers } from "./members-data";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required"}),
  attendance: z.array(z.string().min(1)),
});

export default function EditRushEvent({ mode, initialData, id }) {
  if (mode === "edit" && !id) {
    return;
  }
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
    })
  }, [])

  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      event_date: initialData?.event_date ? (() => {
        const [year, month, day] = initialData.event_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
      attendance: initialData?.attendance || [],
    },
  });

  const toggleMember = (member) => {
    const newSelectedMembers = selectedMembers.includes(member)
      ? selectedMembers.filter((mem) => mem !== member)
      : [...selectedMembers, member];
    setSelectedMembers(newSelectedMembers);
    form.setValue(`attendance`, newSelectedMembers, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  const toggleAllMembers = () => {
    const newSelectedMembers = [];
    if (selectedMembers.length === membersData.length) {
      setSelectedMembers(newSelectedMembers);
    } else {
      for (const { uniqname } of membersData) {
        newSelectedMembers.push(uniqname);
      }
      setSelectedMembers(newSelectedMembers);
    }
    form.setValue(`attendance`, newSelectedMembers, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  async function onSubmit(values) {
    const { name, event_date, attendance } = values;
  
    const supabase = createClientComponentClient();

    if (mode === "edit") {

      const payload = {
        name,
        event_type: "rush_event",
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

      const { error: eventAttendanceDeleteError } = await supabase
        .from('event_attendance')
        .delete()
        .eq('event_id', id)

      if (eventAttendanceDeleteError) {
        console.error("Failed to update event:", eventAttendanceDeleteError.message);
        toast.error("Failed to update event.");
        return;
      }

      const { error: eventAttendanceUpdateError } = await supabase
        .from('event_attendance')
        .insert(attendance.map(mem => ({ event_id: id, uniqname: mem })))
      
      if (eventAttendanceUpdateError) {
        console.error("Failed to update event:", eventAttendanceUpdateError.message);
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
        event_type: "rush_event",
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

      const { error: eventAttendanceUpdateError } = await supabase
        .from('event_attendance')
        .insert(attendance.map(mem => ({ event_id: id, uniqname: mem })))
      
      if (eventAttendanceUpdateError) {
        console.error("Failed to create event:", eventAttendanceUpdateError.message);
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
            <FormLabel className="w-[300px]">Name</FormLabel>
            <FormLabel>Date</FormLabel>
          </div>
          <div className="flex flex-row gap-16 mb-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter a name"
                      type="text"
                      {...field}
                      className="w-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
          <div className="flex flex-col gap-2 w-[564px]">
            <FormLabel>Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <Command className="border shadow-xs">
                      <div className="relative flex flex-row gap-1 justify-between">
                        <CommandInput
                          className="w-[564px] pr-36"
                          placeholder="Search member's name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer size-fit p-1 absolute top-1/2 -translate-y-1/2 right-1.5 opacity-50"
                          onClick={() => toggleAllMembers()}
                        >
                          <Layers2 />Select all
                        </Button>
                      </div>
                      <CommandList>
                        {membersData.map((member) => {
                          const isSelected = selectedMembers.includes(member.uniqname);
                          return (
                            <CustomCommandItem
                              key={member.uniqname}
                              onSelect={() => toggleMember(member.uniqname)}
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
                  <Button className="cursor-pointer" type="submit">Create</Button>
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
                    <Button
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => onDelete()}
                    >
                      Delete
                    </Button>
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