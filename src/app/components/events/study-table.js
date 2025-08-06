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
  AttendanceDualListbox,
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
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
      setAvailableMembers(newMembersData.filter(mem => mem.role === "pledge" && !form.getValues("attendance").includes(mem.uniqname)));
      setSelectedMembers(newMembersData.filter(mem => mem.role === "pledge" && form.getValues("attendance").includes(mem.uniqname)));
      setMembersDataLoading(false);
    })
  }, []);

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
    setIsDeleting(true);
    DeleteEvent({id, router});
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 lg:gap-8 mb-8 items-start">
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className={`${form.getValues("event_date") ? "w-1/2" : "w-[calc(50%-4px)] lg:w-[calc(50%-16px)]"}`}>
                  <FormLabel>Date</FormLabel>
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
                const lastSunday = new Date(date.setDate(date.getDate() - (date.getDay() % 7))).toLocaleDateString();
                const nextSaturday = new Date(date.setDate(date.getDate() + ((date.getDay() + 6) % 7))).toLocaleDateString();
                form.setValue("name", `${lastSunday} - ${nextSaturday} Study Table`);
                return (
                  <div className="w-1/2 flex flex-col gap-2">
                    <FormLabel>Name</FormLabel>
                    <span className="items-center border-input flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 shadow-xs text-sm">
                      {lastSunday} - {nextSaturday} Study Table
                    </span>
                  </div>
                )
              })()
            }
          </div>
          <div className="flex flex-col gap-1">
            <FormLabel>Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceDualListbox
                      allPeople={membersData}
                      availablePeople={availableMembers}
                      setAvailablePeople={setAvailableMembers}
                      selectedPeople={selectedMembers}
                      setSelectedPeople={setSelectedMembers}
                      form={form}
                      formItem="attendance"
                      loading={membersDataLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-row justify-between">
            {mode === "edit"
              ? <>
                  <SaveEventButton submitting={form.formState.isSubmitting}/>
                  <DeleteEventButton submitting={isDeleting} onDelete={onDelete}/>
                </>
              : <CreateEventButton submitting={form.formState.isSubmitting} />
            }
          </div>
        </div>
      </form>
    </Form>
  )
}