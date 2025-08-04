'use client'

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
import { getMembers } from "./members-data";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required"}),
  attendance: z.array(z.string().min(1)),
});

export default function EditStudyTableEvent({ mode, initialData, id }) {
  if (mode === "edit" && !id) {
    return;
  }
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
      setMembersDataLoading(false);
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

  async function onSubmit(values) {
    mode === "edit"
      ? SubmitEdit({ event_type: "study_table", values, id, router })
      : SubmitCreate({ event_type: "study_table", values, router })
  }

  async function onDelete() {
    DeleteEvent(id, router);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="justify-between sm:justify-normal flex flex-row gap-2 sm:gap-16">
            <FormLabel className="w-1/2 sm:w-[200px]">Date</FormLabel>
            {form.getValues("event_date") && <FormLabel className="w-1/2 sm:w-auto">Name</FormLabel>}
          </div>
          <div className="flex flex-row gap-2 sm:gap-16 mb-8">
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
            {form.getValues("event_date") &&
              (() => {
                const date = new Date(form.getValues("event_date"));
                const lastMonday = new Date(date.setDate(date.getDate() - ((date.getDay() + 6) % 7))).toLocaleDateString();
                form.setValue("name", `Week of ${lastMonday} Study Table`);
                return (
                  <span 
                    className="w-1/2 sm:w-[300px] text-sm items-center border-input flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive">
                    Week of {lastMonday} Study Table
                  </span>
                )
              })()
            }
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-[564px]">
            <FormLabel>Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceToggle
                      separate
                      toggle={toggleMember}
                      people={membersData}
                      selectedPeople={selectedMembers} 
                      loading={membersDataLoading}
                    />
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