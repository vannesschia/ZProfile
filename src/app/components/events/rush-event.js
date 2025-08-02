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
import { ChevronDown, Layers2, Loader2Icon } from "lucide-react"
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
import {
  AttendanceToggle,
  CreateEventButton,
  DeleteEvent,
  DeleteEventButton,
  SaveEventButton,
  SelectDate,
  SubmitCreate,
  SubmitEdit
} from "@/app/(with-sidebar)/admin/events/event-editor";
import { toast } from "sonner";
import { getMembers } from "./members-data";
import { useRouter } from "next/navigation";
import CustomCheckbox from "../customcheckbox";

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
    setSelectedMembers(form.getValues("attendance"));
  }, [])

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
      attendance: initialData?.event_attendance.map(attendee => attendee.uniqname) ?? [],
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
    mode === "edit"
      ? SubmitEdit({ event_type: "pledge_event", values, id, router })
      : SubmitCreate({ event_type: "pledge_event", values, router })
  }

  async function onDelete() {
    DeleteEvent(id, router);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="justify-between sm:justify-normal flex flex-row gap-2 sm:gap-16">
            <FormLabel className="w-1/2 sm:w-[300px]">Name</FormLabel>
            <FormLabel className="w-1/2 sm:w-auto">Date</FormLabel>
          </div>
          <div className="flex flex-row gap-2 sm:gap-16 mb-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-1/2 sm:w-[300px]">
                  <FormControl>
                    <Input
                      placeholder="Enter a name"
                      type="text"
                      {...field}
                      className="text-sm w-full"
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
                <FormItem className="w-1/2 sm:w-[200px] flex flex-col">
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form}/>
                  </FormControl>
                  <FormMessage className="flex-grow"/>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-[564px]">
            <FormLabel>Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceToggle selectAll toggleAll={toggleAllMembers} toggle={toggleMember} people={membersData} selectedPeople={selectedMembers} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="w-full sm:w-[564px] flex flex-row gap-4 justify-between">
            {mode === "edit"
              ? <SaveEventButton submitting={form.formState.isSubmitting}/>
              : <CreateEventButton submitting={form.formState.isSubmitting} />
            }
            {mode === "edit" &&
              <DeleteEventButton submitting={form.formState.isSubmitting} onDelete={onDelete}/>
            }
          </div>
        </div>
      </form>
    </Form>
  )
}